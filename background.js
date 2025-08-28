// All Link Downloader - Background Service Worker
// Handles downloads independently of popup state

console.log('All Link Downloader: Background service worker loaded');

// Download state
let currentDownloads = [];
let downloadInProgress = false;
let totalFiles = 0;
let completedFiles = 0;
let currentDelay = 0;

// Message handler for communication with popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('Background received message:', message.action);

    try {
        switch (message.action) {
            case 'startBulkDownload':
                handleBulkDownload(message.files, message.delay, sendResponse);
                return true; // Will respond asynchronously

            case 'getDownloadStatus':
                console.log(`Download status request: inProgress=${downloadInProgress}, completed=${completedFiles}, total=${totalFiles}, remaining=${currentDownloads.length}`);
                sendResponse({
                    inProgress: downloadInProgress,
                    current: currentDownloads.length > 0 ? currentDownloads[0] : null,
                    remaining: currentDownloads.length,
                    completed: completedFiles,
                    total: totalFiles,
                    delay: currentDelay
                });
                return true; // Indicate async response

            case 'cancelDownloads':
                cancelAllDownloads();
                sendResponse({ success: true });
                return true; // Indicate async response

                        case 'ping':
                console.log('Background script ping received');
                sendResponse({ success: true, message: 'Background script is alive' });
                return true;

            default:
                console.log('Unknown background message action:', message.action);
                sendResponse({ success: false, error: 'Unknown action' });
                return true;
        }
    } catch (error) {
        console.error('Error in message handler:', error);
        sendResponse({ success: false, error: error.message });
        return true;
    }
});

// Handle bulk download request
async function handleBulkDownload(files, delay, sendResponse) {
    if (downloadInProgress) {
        sendResponse({ success: false, error: 'Download already in progress' });
        return;
    }

        console.log(`Starting bulk download of ${files.length} files with ${delay}ms delay`);

    // Set global download state
    currentDownloads = [...files];
    downloadInProgress = true;
    totalFiles = files.length;
    completedFiles = 0;
    currentDelay = delay;
    let failedCount = 0;

    sendResponse({ success: true, message: 'Downloads started' });

    // Send initial progress update
    notifyPopupProgress(completedFiles, totalFiles, currentDownloads.length);

        // Process downloads with delay
    for (let i = 0; i < files.length; i++) {
        // Check if downloads were cancelled
        if (!downloadInProgress) {
            console.log(`🛑 Downloads cancelled at file ${i + 1}/${files.length}. Files completed so far: ${completedFiles}`);
            break;
        }

        const file = files[i];

        try {
            console.log(`Downloading file ${i + 1}/${files.length}: ${file.fileName}`);

            // Download the file
            const downloadId = await downloadFile(file.url, file.fileName);

            if (downloadId) {
                completedFiles++;
                console.log(`Download ${i + 1} started successfully: ${file.fileName}`);
            } else {
                failedCount++;
                console.log(`Download ${i + 1} failed: ${file.fileName}`);
            }

        } catch (error) {
            console.error(`Error downloading file ${i + 1}:`, error);
            failedCount++;
        }

        // Check again if downloads were cancelled (in case cancelled during download)
        if (!downloadInProgress) {
            console.log(`🛑 Downloads cancelled after file ${i + 1}/${files.length}. Files completed: ${completedFiles}`);
            currentDownloads.shift(); // Remove current file from queue
            break;
        }

        // Update progress
        currentDownloads.shift(); // Remove completed file from queue
        notifyPopupProgress(completedFiles, totalFiles, currentDownloads.length);

        // Apply delay between downloads (except for the last one)
        if (i < files.length - 1 && delay > 0) {
            await sleep(delay);
        }
    }

            // Check if downloads were completed or cancelled
    if (downloadInProgress) {
        // Normal completion
        downloadInProgress = false;
        currentDownloads = [];

        console.log(`✅ Bulk download completed. Success: ${completedFiles}, Failed: ${failedCount}`);

        // Send completion notification
        notifyPopupCompletion(completedFiles, failedCount);
        } else {
        // Downloads were cancelled
        const remainingFiles = totalFiles - completedFiles;
        console.log(`🛑 Bulk download cancelled. Completed: ${completedFiles}, Remaining: ${remainingFiles}`);

        // Send cancellation notification
        notifyPopupCancellation(completedFiles, remainingFiles);

        // Reset download state after cancellation
        currentDownloads = [];
    }

    // Reset download state after completion/cancellation
    setTimeout(() => {
        totalFiles = 0;
        completedFiles = 0;
        currentDelay = 0;
    }, 5000); // Keep state for 5 seconds to allow popup to read final status
}

// Download a single file
function downloadFile(url, filename) {
    return new Promise((resolve) => {
        chrome.downloads.download({
            url: url,
            filename: filename,
            saveAs: false
        }, (downloadId) => {
            if (chrome.runtime.lastError) {
                console.error('Download failed:', chrome.runtime.lastError);
                resolve(null);
            } else {
                resolve(downloadId);
            }
        });
    });
}

// Sleep utility function with cancellation support
function sleep(ms) {
    return new Promise((resolve) => {
        // Check every 100ms if downloads were cancelled during the sleep
        const checkInterval = Math.min(100, ms);
        let elapsed = 0;

        const intervalId = setInterval(() => {
            if (!downloadInProgress) {
                // Downloads were cancelled, resolve immediately
                clearInterval(intervalId);
                resolve();
                return;
            }

            elapsed += checkInterval;
            if (elapsed >= ms) {
                clearInterval(intervalId);
                resolve();
            }
        }, checkInterval);
    });
}

// Notify popup of progress updates
function notifyPopupProgress(completed, total, remaining) {
    // Try to send progress update to popup (if it's open)
    chrome.runtime.sendMessage({
        action: 'downloadProgress',
        completed: completed,
        total: total,
        remaining: remaining,
        percentage: total === 0 ? 0 : Math.round((completed / total) * 100)
    }).catch(() => {
        // Popup might be closed, which is fine
        console.log('Could not send progress update to popup (popup likely closed)');
    });
}

// Notify popup of completion
function notifyPopupCompletion(completed, failed) {
    chrome.runtime.sendMessage({
        action: 'downloadComplete',
        completed: completed,
        failed: failed
    }).catch(() => {
        // Popup might be closed, which is fine
        console.log('Could not send completion notification to popup (popup likely closed)');
    });
}

// Notify popup of cancellation
function notifyPopupCancellation(completed, remaining) {
    chrome.runtime.sendMessage({
        action: 'downloadCancelled',
        completed: completed,
        remaining: remaining
    }).catch(() => {
        // Popup might be closed, which is fine
        console.log('Could not send cancellation notification to popup (popup likely closed)');
    });
}

// Cancel all pending downloads
function cancelAllDownloads() {
    console.log(`🛑 Cancelling all pending downloads. Current state: completed=${completedFiles}, total=${totalFiles}, remaining=${currentDownloads.length}`);

    // Only set the flag to stop downloads - don't reset counts yet
    // The download loop will handle proper completion/cancellation logic
    downloadInProgress = false;
}

// Handle extension startup
chrome.runtime.onStartup.addListener(() => {
    console.log('Extension startup - resetting download state');
    currentDownloads = [];
    downloadInProgress = false;
    totalFiles = 0;
    completedFiles = 0;
    currentDelay = 0;
});

// Handle extension installation
chrome.runtime.onInstalled.addListener(() => {
    console.log('Extension installed/updated - initializing background script');
    currentDownloads = [];
    downloadInProgress = false;
    totalFiles = 0;
    completedFiles = 0;
    currentDelay = 0;
});
