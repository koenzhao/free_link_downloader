// All Link Downloader - Popup Script
// Handles the popup interface and coordinates with content script for file downloading

document.addEventListener('DOMContentLoaded', function() {
    console.log('All Link Downloader popup loaded!');

    // Get references to DOM elements
    const loadingSection = document.getElementById('loadingSection');
    const pageInfo = document.getElementById('pageInfo');
    const pageTitle = document.getElementById('pageTitle');
    const linkStats = document.getElementById('linkStats');
    const controls = document.getElementById('controls');
    const progressContainer = document.getElementById('progressContainer');
    const progressBar = document.getElementById('progressBar');
    const progressText = document.getElementById('progressText');
    const progressPercentage = document.getElementById('progressPercentage');
    const progressRemaining = document.getElementById('progressRemaining');
    const progressDelay = document.getElementById('progressDelay');
    const stopDownloadsBtn = document.getElementById('stopDownloadsBtn');
    const filesList = document.getElementById('filesList');
    const noFilesSection = document.getElementById('noFilesSection');
    const errorSection = document.getElementById('errorSection');
    const errorMessage = document.getElementById('errorMessage');
    const footerInfo = document.getElementById('footerInfo');
    const downloadProgress = document.getElementById('downloadProgress');

        // Control buttons
    const downloadAllBtn = document.getElementById('downloadAllBtn');
    const highlightBtn = document.getElementById('highlightBtn');
    const rescanBtn = document.getElementById('rescanBtn');
    const noFilesRescanBtn = document.getElementById('noFilesRescanBtn');
    const retryBtn = document.getElementById('retryBtn');
    const fileTypeFilter = document.getElementById('fileTypeFilter');
    const downloadDelaySelect = document.getElementById('downloadDelay');
    const selectAllBtn = document.getElementById('selectAllBtn');
    const selectNoneBtn = document.getElementById('selectNoneBtn');

    // State variables
    let allLinks = [];
    let filteredLinks = [];
    let isHighlighted = false;
    let downloadedCount = 0;
    let totalDownloadCount = 0;
    let downloadDelay = 1000; // Default 1 second delay between downloads
    let backgroundDownloadsInProgress = false; // Track if background downloads are happening

    // Initialize delay setting from UI
    if (downloadDelaySelect) {
        downloadDelay = parseInt(downloadDelaySelect.value);
    }

    // Initialize stop button state (disabled by default)
    if (stopDownloadsBtn) {
        stopDownloadsBtn.disabled = true;
    }

    // File type categorization
    const FILE_CATEGORIES = {
        document: ['pdf', 'doc', 'docx', 'txt', 'rtf', 'odt', 'pages', 'xls', 'xlsx', 'csv', 'ods', 'numbers', 'ppt', 'pptx', 'odp', 'key'],
        archive: ['zip', 'rar', '7z', 'tar', 'gz', 'bz2', 'xz', 'dmg', 'pkg'],
        media: ['mp3', 'wav', 'flac', 'aac', 'ogg', 'm4a', 'mp4', 'avi', 'mkv', 'mov', 'wmv', 'flv', 'webm', 'jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp', 'tiff'],
        code: ['json', 'xml', 'sql', 'db', 'sqlite', 'js', 'html', 'css', 'py', 'java', 'cpp', 'c', 'h', 'exe', 'msi', 'deb', 'rpm', 'app', 'apk', 'iso', 'img', 'bin', 'log', 'conf', 'cfg']
    };

    // Show different sections
    function showSection(sectionToShow) {
        [loadingSection, progressContainer, filesList, noFilesSection, errorSection].forEach(section => {
            section.classList.add('hidden');
        });
        sectionToShow.classList.remove('hidden');
    }

    // Show progress bar
    function showProgressBar() {
        progressContainer.classList.remove('hidden');
    }

    // Hide progress bar
    function hideProgressBar() {
        progressContainer.classList.add('hidden');
    }

    // Update progress bar
    function updateProgressBar(downloaded, total, delay) {
        const percentage = total === 0 ? 0 : Math.round((downloaded / total) * 100);
        const remaining = total - downloaded;

        // Update progress bar width
        progressBar.style.width = `${percentage}%`;

        // Update text elements
        progressText.textContent = `Downloaded: ${downloaded}/${total} files`;
        progressPercentage.textContent = `${percentage}%`;
        progressRemaining.textContent = `${remaining} files remaining`;

        // Update delay info
        const delayText = delay === 0 ? 'no delay' : `${delay/1000}s delay`;
        progressDelay.textContent = delayText;
    }

    // Get file category
    function getFileCategory(extension) {
        for (const [category, extensions] of Object.entries(FILE_CATEGORIES)) {
            if (extensions.includes(extension.toLowerCase())) {
                return category;
            }
        }
        return 'other';
    }

    // Format file size
    function formatFileSize(sizeStr) {
        if (!sizeStr) return 'Unknown size';
        return sizeStr;
    }

        // Create file item HTML
    function createFileItemHTML(link, index) {
        const category = getFileCategory(link.extension);
        const displayName = link.fileName.length > 30 ? link.fileName.substring(0, 30) + '...' : link.fileName;

        return `
            <div class="file-item" data-index="${index}">
                <div class="file-header">
                    <div class="file-info">
                        <input type="checkbox" class="file-checkbox" id="file-${index}" data-index="${index}" checked>
                        <label for="file-${index}" class="file-name" title="${link.fileName}">${displayName}</label>
                    </div>
                    <span class="file-extension ${category}">${link.extension}</span>
                </div>
                <div class="file-details">
                    <span class="file-size">${formatFileSize(link.fileSize)}</span>
                </div>
            </div>
        `;
    }

        // Render files list
    function renderFilesList(links) {
        if (links.length === 0) {
            showSection(noFilesSection);
            return;
        }

        filesList.innerHTML = links.map(createFileItemHTML).join('');

        // Add checkbox event handlers
        filesList.querySelectorAll('.file-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', updateSelectionStats);
        });

        // Add click handlers for file items (toggle checkbox)
        filesList.querySelectorAll('.file-item').forEach(item => {
            item.addEventListener('click', function(e) {
                // Don't toggle if clicking on checkbox or label
                if (e.target.type === 'checkbox' || e.target.tagName === 'LABEL') {
                    return;
                }

                const checkbox = this.querySelector('.file-checkbox');
                if (checkbox) {
                    checkbox.checked = !checkbox.checked;
                    updateSelectionStats();
                }
            });
        });

        showSection(filesList);
        updateSelectionStats();
    }

        // Listen for background script messages
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        switch (message.action) {
            case 'downloadProgress':
                handleDownloadProgress(message);
                break;
            case 'downloadComplete':
                handleDownloadComplete(message);
                break;
            case 'downloadCancelled':
                handleDownloadCancelled(message);
                break;
        }
    });

        // Handle download progress updates from background
    function handleDownloadProgress(progress) {
        console.log('Received download progress update:', progress);
        downloadedCount = progress.completed;
        totalDownloadCount = progress.total;

        // Update progress bar if visible
        if (!progressContainer.classList.contains('hidden')) {
            updateProgressBar(progress.completed, progress.total, downloadDelay);
        }

        // Update old progress display
        updateDownloadProgress();
    }

                // Handle download completion from background
    function handleDownloadComplete(result) {
        console.log(`Downloads completed! Success: ${result.completed}, Failed: ${result.failed}`);

        // Clear background download state
        backgroundDownloadsInProgress = false;

        // Re-enable download button and disable stop button
        downloadAllBtn.disabled = false;
        stopDownloadsBtn.disabled = true;
        updateSelectionStats();

        // Hide progress bar after a delay and return to normal view
        setTimeout(() => {
            hideProgressBar();
            showSection(filesList);
            footerInfo.textContent = `Downloads completed! ${result.completed} files downloaded${result.failed > 0 ? `, ${result.failed} failed` : ''}`;
        }, 2000);
    }

    // Handle download cancellation from background
    function handleDownloadCancelled(result) {
        console.log(`✅ Downloads cancelled! Completed: ${result.completed}, Remaining: ${result.remaining}`);

        // Clear background download state
        backgroundDownloadsInProgress = false;

        // Re-enable download button and disable stop button
        downloadAllBtn.disabled = false;
        stopDownloadsBtn.disabled = true;
        updateSelectionStats();

        // Hide progress bar and return to normal view immediately
        hideProgressBar();
        showSection(filesList);
        footerInfo.textContent = `Downloads stopped! ${result.completed} files downloaded, ${result.remaining} cancelled.`;
        footerInfo.style.color = '#fd7e14'; // Orange color for warning

        // Reset footer color after a delay
        setTimeout(() => {
            footerInfo.style.color = '';
        }, 5000);
    }

        // Stop ongoing downloads
    function stopDownloads() {
        console.log('🛑 Stopping downloads...');

        // Disable stop button to prevent multiple clicks
        stopDownloadsBtn.disabled = true;
        stopDownloadsBtn.textContent = '⏹️ Stopping...';

        chrome.runtime.sendMessage({ action: 'cancelDownloads' }, function(response) {
            if (chrome.runtime.lastError) {
                console.error('Failed to cancel downloads:', chrome.runtime.lastError);
                footerInfo.textContent = 'Failed to stop downloads. Please try again.';
                footerInfo.style.color = '#dc3545';

                // Re-enable stop button
                stopDownloadsBtn.disabled = false;
                stopDownloadsBtn.textContent = '🛑 Stop Downloads';
            } else if (response && response.success) {
                console.log('✅ Downloads cancellation request sent successfully');

                // Show immediate feedback while waiting for background confirmation
                footerInfo.textContent = 'Stopping downloads...';
                footerInfo.style.color = '#fd7e14';

                // The actual UI cleanup will be handled by handleDownloadCancelled
                // when the background script sends the cancellation confirmation
            } else {
                console.error('Unexpected response from cancel downloads:', response);
                footerInfo.textContent = 'Unexpected error stopping downloads.';
                footerInfo.style.color = '#dc3545';

                // Re-enable stop button
                stopDownloadsBtn.disabled = false;
                stopDownloadsBtn.textContent = '🛑 Stop Downloads';
            }
        });
    }

    // Download a single file (for individual file downloads)
    function downloadFile(url, filename, buttonElement = null) {
        if (buttonElement) {
            buttonElement.disabled = true;
            buttonElement.textContent = '⏳ Downloading...';
        }

        // Send to background for processing
        chrome.runtime.sendMessage({
            action: 'startBulkDownload',
            files: [{ url: url, fileName: filename }],
            delay: 0  // No delay for single file
        }, function(response) {
            if (chrome.runtime.lastError) {
                console.error('Failed to communicate with background script:', chrome.runtime.lastError);
                if (buttonElement) {
                    buttonElement.disabled = false;
                    buttonElement.textContent = '❌ Failed';
                    setTimeout(() => {
                        buttonElement.textContent = '📥 Download';
                    }, 2000);
                }
            } else if (response.success) {
                if (buttonElement) {
                    buttonElement.textContent = '✅ Downloaded';
                    buttonElement.style.background = '#28a745';
                    setTimeout(() => {
                        buttonElement.disabled = false;
                        buttonElement.textContent = '📥 Download';
                        buttonElement.style.background = '';
                    }, 3000);
                }
            } else {
                if (buttonElement) {
                    buttonElement.disabled = false;
                    buttonElement.textContent = '❌ Failed';
                    setTimeout(() => {
                        buttonElement.textContent = '📥 Download';
                    }, 2000);
                }
            }
        });
    }

        // Get selected files
    function getSelectedFiles() {
        const selectedFiles = [];
        const checkboxes = filesList.querySelectorAll('.file-checkbox:checked');

        checkboxes.forEach(checkbox => {
            const index = parseInt(checkbox.dataset.index);
            if (filteredLinks[index]) {
                selectedFiles.push(filteredLinks[index]);
            }
        });

        return selectedFiles;
    }

    // Update selection statistics
    function updateSelectionStats() {
        const selectedFiles = getSelectedFiles();
        const selectedCount = selectedFiles.length;
        const totalCount = filteredLinks.length;

        // Update download button text
        if (selectedCount === 0) {
            downloadAllBtn.textContent = '📥 Download (0)';
            downloadAllBtn.disabled = true;
        } else {
            downloadAllBtn.textContent = `📥 Download (${selectedCount})`;
            downloadAllBtn.disabled = false;
        }

        // Update footer stats
        if (selectedCount !== totalCount) {
            footerInfo.textContent = `${selectedCount} of ${totalCount} files selected`;
        } else {
            footerInfo.textContent = `Ready (${totalCount} files found)`;
        }
    }

            // Download selected files
    function downloadSelectedFiles() {
        const selectedFiles = getSelectedFiles();

        if (selectedFiles.length === 0) {
            return;
        }

        downloadAllBtn.disabled = true;
        downloadAllBtn.textContent = '⏳ Downloading...';
        downloadedCount = 0;
        totalDownloadCount = selectedFiles.length;

        // Show progress bar
        showProgressBar();
        updateProgressBar(0, selectedFiles.length, downloadDelay);

        // Hide old progress text
        downloadProgress.classList.add('hidden');

                // Send download request to background script
        chrome.runtime.sendMessage({
            action: 'startBulkDownload',
            files: selectedFiles,
            delay: downloadDelay
        }, function(response) {
                        if (chrome.runtime.lastError) {
                console.error('Failed to communicate with background script:', chrome.runtime.lastError);
                console.error('Error details:', chrome.runtime.lastError.message);

                                // Clear download state on error
                backgroundDownloadsInProgress = false;

                // Re-enable download button and disable stop button
                downloadAllBtn.disabled = false;
                stopDownloadsBtn.disabled = true;
                updateSelectionStats();
                hideProgressBar();
                showSection(filesList);
                footerInfo.textContent = `Background script error: ${chrome.runtime.lastError.message}. Please reload extension.`;
                footerInfo.style.color = '#dc3545';
            } else if (!response) {
                console.error('Background script returned no response');

                                // Clear download state on error
                backgroundDownloadsInProgress = false;

                // Re-enable download button and disable stop button
                downloadAllBtn.disabled = false;
                stopDownloadsBtn.disabled = true;
                updateSelectionStats();
                hideProgressBar();
                showSection(filesList);
                footerInfo.textContent = 'Background script not responding. Please reload extension.';
                footerInfo.style.color = '#dc3545';
            } else if (response.success) {
                console.log('Bulk download started in background');
                backgroundDownloadsInProgress = true; // Set state to prevent page scanning

                // Enable stop button
                stopDownloadsBtn.disabled = false;
                stopDownloadsBtn.textContent = '🛑 Stop Downloads';

                footerInfo.textContent = 'Downloads started in background. You can close this popup.';
                footerInfo.style.color = ''; // Reset color
                        } else {
                console.error('Background script rejected download request:', response.error);

                                // Clear download state on failure
                backgroundDownloadsInProgress = false;

                // Re-enable download button and disable stop button
                downloadAllBtn.disabled = false;
                stopDownloadsBtn.disabled = true;
                updateSelectionStats();
                hideProgressBar();
                showSection(filesList);
                footerInfo.textContent = response.error || 'Failed to start downloads.';
                footerInfo.style.color = '#dc3545';
            }
        });
    }

    // Update download progress
    function updateDownloadProgress() {
        const delayText = downloadDelay === 0 ? 'no delay' : `${downloadDelay/1000}s delay`;
        const total = totalDownloadCount || getSelectedFiles().length;
        downloadProgress.textContent = `Downloaded: ${downloadedCount}/${total} (${delayText})`;
    }

    // Filter links by type
    function filterLinks() {
        const filterValue = fileTypeFilter.value;

        if (!filterValue) {
            filteredLinks = [...allLinks];
        } else {
            filteredLinks = allLinks.filter(link => {
                const category = getFileCategory(link.extension);
                return category === filterValue;
            });
        }

        renderFilesList(filteredLinks);
        updateStats();
    }

        // Update statistics
    function updateStats() {
        const count = filteredLinks.length;
        const total = allLinks.length;

        if (fileTypeFilter.value) {
            linkStats.textContent = `Found ${count} of ${total} files (${fileTypeFilter.value})`;
        } else {
            linkStats.textContent = `Found ${count} downloadable files`;
        }

        // Stats will be updated by updateSelectionStats when files are rendered
    }

        // Inject content script if needed
    function injectContentScript(tabId, callback) {
        chrome.scripting.executeScript({
            target: { tabId: tabId },
            files: ['content.js']
        }, function(results) {
            if (chrome.runtime.lastError) {
                console.error('Failed to inject content script:', chrome.runtime.lastError);
                callback(false);
            } else {
                console.log('Content script injected successfully');
                callback(true);
            }
        });
    }

    // Try to communicate with content script, inject if needed
    function tryContentScriptCommunication(activeTab, retryCount = 0) {
        chrome.tabs.sendMessage(activeTab.id, { action: 'scanForFileLinks' }, function(response) {
            if (chrome.runtime.lastError) {
                console.log('Content script communication failed, attempt:', retryCount + 1);

                if (retryCount < 2) {
                    // Try to inject the content script
                    footerInfo.textContent = 'Initializing scanner...';
                    injectContentScript(activeTab.id, function(success) {
                        if (success) {
                            // Retry communication after injection
                            tryContentScriptCommunication(activeTab, retryCount + 1);
                        } else {
                            showError('Unable to initialize page scanner. This page may restrict extensions.');
                        }
                    });
                } else {
                    showError('Unable to scan this page. Please refresh the page and try again.');
                }
                return;
            }

                        // Content script responded successfully
            if (response && response.success) {
                allLinks = response.links || [];
                filteredLinks = [...allLinks];

                                // Update page info and show controls
                pageTitle.textContent = response.pageTitle || 'Current Page';
                pageInfo.classList.remove('hidden');
                controls.classList.remove('hidden');

                // Render results
                if (allLinks.length === 0) {
                    showSection(noFilesSection);
                } else {
                    renderFilesList(filteredLinks);
                }

                updateStats();
                footerInfo.textContent = `Ready (${allLinks.length} files found)`;
            } else {
                showError(response ? response.error : 'Scanner returned no results');
            }
        });
    }

    // Scan current page for links
    function scanCurrentPage() {
        // Don't scan page if background downloads are in progress
        if (backgroundDownloadsInProgress) {
            console.log('⏸️ Skipping page scan - background downloads in progress');
            return;
        }

        showSection(loadingSection);
        footerInfo.textContent = 'Scanning page...';

        chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
            if (tabs.length === 0) {
                showError('No active tab found');
                return;
            }

            const activeTab = tabs[0];

            // Check if we can access this page
            if (activeTab.url.startsWith('chrome://') ||
                activeTab.url.startsWith('chrome-extension://') ||
                activeTab.url.startsWith('edge://') ||
                activeTab.url.startsWith('about:') ||
                activeTab.url.startsWith('moz-extension://')) {
                showError('Cannot scan browser internal pages or extension pages');
                return;
            }

            // Check for other restricted URLs
            if (activeTab.url === 'about:blank' || activeTab.url === '') {
                showError('Cannot scan blank or empty pages');
                return;
            }

            // Try to communicate with content script
            tryContentScriptCommunication(activeTab);
        });
    }

    // Show error
    function showError(message) {
        errorMessage.textContent = message;
        showSection(errorSection);
        footerInfo.textContent = 'Error occurred';
    }

        // Toggle link highlighting
    function toggleHighlighting() {
        chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
            if (tabs.length === 0) return;

            const activeTab = tabs[0];
            const action = isHighlighted ? 'removeHighlight' : 'highlightLinks';

            chrome.tabs.sendMessage(activeTab.id, { action: action }, function(response) {
                if (chrome.runtime.lastError) {
                    console.log('Highlight communication failed, trying to inject script...');
                    injectContentScript(activeTab.id, function(success) {
                        if (success) {
                            // Retry highlight after injection
                            chrome.tabs.sendMessage(activeTab.id, { action: action }, function(response) {
                                if (response && response.success) {
                                    isHighlighted = !isHighlighted;
                                    highlightBtn.textContent = isHighlighted ? '❌ Remove Highlight' : '🔍 Highlight Links';
                                }
                            });
                        }
                    });
                } else if (response && response.success) {
                    isHighlighted = !isHighlighted;
                    highlightBtn.textContent = isHighlighted ? '❌ Remove Highlight' : '🔍 Highlight Links';
                }
            });
        });
    }

    // Select all files
    function selectAllFiles() {
        const checkboxes = filesList.querySelectorAll('.file-checkbox');
        checkboxes.forEach(checkbox => {
            checkbox.checked = true;
        });
        updateSelectionStats();
    }

    // Select no files
    function selectNoFiles() {
        const checkboxes = filesList.querySelectorAll('.file-checkbox');
        checkboxes.forEach(checkbox => {
            checkbox.checked = false;
        });
        updateSelectionStats();
    }

    // Update download delay when user changes selection
    function updateDownloadDelay() {
        downloadDelay = parseInt(downloadDelaySelect.value);
        console.log('Download delay set to:', downloadDelay === 0 ? 'no delay' : `${downloadDelay/1000}s`);
    }

    // Event listeners
    downloadAllBtn.addEventListener('click', downloadSelectedFiles);
    highlightBtn.addEventListener('click', toggleHighlighting);
    stopDownloadsBtn.addEventListener('click', stopDownloads);
    rescanBtn.addEventListener('click', scanCurrentPage);
    noFilesRescanBtn.addEventListener('click', scanCurrentPage);
    retryBtn.addEventListener('click', scanCurrentPage);
    fileTypeFilter.addEventListener('change', filterLinks);
    downloadDelaySelect.addEventListener('change', updateDownloadDelay);
    selectAllBtn.addEventListener('click', selectAllFiles);
    selectNoneBtn.addEventListener('click', selectNoFiles);

    // Keyboard shortcuts
    document.addEventListener('keydown', function(event) {
        if (event.key.toLowerCase() === 'd' && !event.ctrlKey && !event.metaKey) {
            event.preventDefault();
            if (!downloadAllBtn.disabled) {
                downloadSelectedFiles();
            }
        } else if (event.key.toLowerCase() === 'h' && !event.ctrlKey && !event.metaKey) {
            event.preventDefault();
            toggleHighlighting();
        } else if (event.key.toLowerCase() === 'r' && !event.ctrlKey && !event.metaKey) {
            event.preventDefault();
            scanCurrentPage();
        } else if (event.key.toLowerCase() === 'a' && (event.ctrlKey || event.metaKey)) {
            event.preventDefault();
            selectAllFiles();
        } else if (event.key === 'Escape') {
            event.preventDefault();
            selectNoFiles();
        }
    });

        // Test background script connection
    function testBackgroundConnection() {
        console.log('Testing background script connection...');
        chrome.runtime.sendMessage({ action: 'ping' }, function(response) {
            if (chrome.runtime.lastError) {
                console.error('Background script connection test failed:', chrome.runtime.lastError);
                footerInfo.textContent = 'Background script error. Please reload extension.';
                footerInfo.style.color = '#dc3545';
            } else if (response && response.success) {
                console.log('Background script connection successful:', response.message);
                footerInfo.style.color = ''; // Reset color
            } else {
                console.error('Background script unexpected response:', response);
                footerInfo.textContent = 'Background script communication error.';
                footerInfo.style.color = '#dc3545';
            }
        });
    }

            // Check for ongoing downloads when popup opens
    function checkDownloadStatus() {
        return new Promise((resolve) => {
            console.log('🔍 Checking download status...');
            chrome.runtime.sendMessage({ action: 'getDownloadStatus' }, function(response) {
                if (chrome.runtime.lastError) {
                    console.log('❌ Could not check download status:', chrome.runtime.lastError);
                    resolve(false);
                    return;
                }

                console.log('📊 Download status response:', response);

                if (response && response.inProgress) {
                    console.log('🚀 Downloads in progress detected:', response);

                    // Set global state
                    backgroundDownloadsInProgress = true;

                    // Show progress bar with current state
                    downloadedCount = response.completed;
                    totalDownloadCount = response.total;

                    // Update delay if provided
                    if (response.delay !== undefined) {
                        downloadDelay = response.delay;
                        if (downloadDelaySelect) {
                            downloadDelaySelect.value = response.delay;
                        }
                    }

                    console.log('📈 Restoring progress bar - completed:', response.completed, 'total:', response.total);
                    showProgressBar();
                    updateProgressBar(response.completed, response.total, downloadDelay);

                                        downloadAllBtn.disabled = true;
                    downloadAllBtn.textContent = '⏳ Downloading...';

                    // Enable stop button
                    stopDownloadsBtn.disabled = false;
                    stopDownloadsBtn.textContent = '🛑 Stop Downloads';

                    footerInfo.textContent = 'Downloads in progress in background. You can close this popup.';

                    // Hide file list and show progress bar as main content
                    showSection(progressContainer);
                    console.log('✅ Progress bar should now be visible - preventing page scan');
                    resolve(true); // Downloads in progress, don't scan page
                } else {
                    console.log('💤 No downloads in progress. Response:', response);
                    backgroundDownloadsInProgress = false;
                    resolve(false); // No downloads, can scan page
                }
            });
        });
    }

    // Console debugging utilities (for development)
    window.debugExtension = {
        checkStatus: checkDownloadStatus,
        testConnection: testBackgroundConnection,
        stopDownloads: stopDownloads
    };

    // Initialize with proper async handling
    async function initialize() {
        console.log('🚀 Initializing extension popup...');

        // Test background connection first
        testBackgroundConnection();

        // Check for ongoing downloads
        const downloadsInProgress = await checkDownloadStatus();

        if (downloadsInProgress) {
            console.log('⏸️ Downloads in progress - skipping page scan to preserve progress view');
            // Don't scan page when downloads are in progress
            // Progress bar is already shown by checkDownloadStatus
        } else {
            console.log('📄 No downloads in progress - proceeding with page scan');
            // Only scan page if no downloads are happening
            scanCurrentPage();
        }
    }

    // Start initialization
    initialize();
});

// Error handling
window.addEventListener('error', function(event) {
    console.error('Popup error:', event.error);
});

window.addEventListener('unhandledrejection', function(event) {
    console.error('Unhandled promise rejection:', event.reason);
});