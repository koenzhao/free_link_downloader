// All Link Downloader - Content Script
// Scans the current webpage for downloadable file links

(function() {
    'use strict';

    // Common file extensions for downloadable files
    const FILE_EXTENSIONS = [
        // Documents
        'pdf', 'doc', 'docx', 'txt', 'rtf', 'odt', 'pages',
        'xls', 'xlsx', 'csv', 'ods', 'numbers',
        'ppt', 'pptx', 'odp', 'key',

        // Archives
        'zip', 'rar', '7z', 'tar', 'gz', 'bz2', 'xz', 'dmg', 'pkg',

        // Media
        'mp3', 'wav', 'flac', 'aac', 'ogg', 'm4a',
        'mp4', 'avi', 'mkv', 'mov', 'wmv', 'flv', 'webm',
        'jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp', 'tiff',

        // Code & Data
        'json', 'xml', 'sql', 'db', 'sqlite',
        'js', 'html', 'css', 'py', 'java', 'cpp', 'c', 'h',

        // Executables & Installers
        'exe', 'msi', 'deb', 'rpm', 'app', 'apk',

        // Other common files
        'iso', 'img', 'bin', 'log', 'conf', 'cfg'
    ];

    // Function to extract file extension from URL
    function getFileExtension(url) {
        try {
            const urlObj = new URL(url);
            const pathname = urlObj.pathname;
            const match = pathname.match(/\.([^./?#]+)(?:[?#]|$)/i);
            return match ? match[1].toLowerCase() : null;
        } catch (e) {
            return null;
        }
    }

    // Function to check if a URL is a downloadable file
    function isDownloadableFile(url) {
        const extension = getFileExtension(url);
        return extension && FILE_EXTENSIONS.includes(extension);
    }

    // Function to get file size (if available in the link)
    function getFileSizeFromText(linkElement) {
        const text = linkElement.textContent || '';
        const sizeMatch = text.match(/\(([0-9.]+\s*(KB|MB|GB|TB))\)/i);
        return sizeMatch ? sizeMatch[1] : null;
    }

    // Function to scan page for file links
    function scanPageForFileLinks() {
        const links = document.querySelectorAll('a[href]');
        const fileLinks = [];

        links.forEach((link, index) => {
            const href = link.href;

            // Skip if not a downloadable file
            if (!isDownloadableFile(href)) {
                return;
            }

            // Extract information about the link
            const extension = getFileExtension(href);
            const fileName = href.split('/').pop().split('?')[0] || `file_${index}.${extension}`;
            const linkText = link.textContent.trim() || fileName;
            const fileSize = getFileSizeFromText(link);

            // Get surrounding context for better identification
            const parent = link.parentElement;
            const context = parent ? parent.textContent.trim().substring(0, 100) : '';

            fileLinks.push({
                url: href,
                fileName: fileName,
                linkText: linkText,
                extension: extension,
                fileSize: fileSize,
                context: context,
                index: index
            });
        });

        return fileLinks;
    }

    // Function to highlight file links on the page
    function highlightFileLinks() {
        const links = document.querySelectorAll('a[href]');
        let highlightedCount = 0;

        links.forEach(link => {
            if (isDownloadableFile(link.href)) {
                // Add visual highlighting
                link.style.cssText += `
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
                    color: white !important;
                    padding: 2px 6px !important;
                    border-radius: 4px !important;
                    text-decoration: none !important;
                    box-shadow: 0 2px 4px rgba(102, 126, 234, 0.3) !important;
                `;
                highlightedCount++;
            }
        });

        return highlightedCount;
    }

    // Function to remove highlighting
    function removeHighlighting() {
        const links = document.querySelectorAll('a[href]');
        links.forEach(link => {
            if (isDownloadableFile(link.href)) {
                link.style.cssText = link.style.cssText.replace(
                    /background:.*?!important;|color:.*?!important;|padding:.*?!important;|border-radius:.*?!important;|text-decoration:.*?!important;|box-shadow:.*?!important;/g,
                    ''
                );
            }
        });
    }

    // Listen for messages from popup
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        console.log('Content script received message:', request.action);

        if (request.action === 'scanForFileLinks') {
            try {
                const fileLinks = scanPageForFileLinks();
                console.log('Found', fileLinks.length, 'downloadable files');
                sendResponse({
                    success: true,
                    links: fileLinks,
                    pageTitle: document.title,
                    pageUrl: window.location.href,
                    totalLinks: document.querySelectorAll('a[href]').length
                });
            } catch (error) {
                console.error('Error scanning for files:', error);
                sendResponse({
                    success: false,
                    error: error.message
                });
            }
        } else if (request.action === 'highlightLinks') {
            try {
                const count = highlightFileLinks();
                console.log('Highlighted', count, 'file links');
                sendResponse({
                    success: true,
                    highlightedCount: count
                });
            } catch (error) {
                console.error('Error highlighting links:', error);
                sendResponse({
                    success: false,
                    error: error.message
                });
            }
        } else if (request.action === 'removeHighlight') {
            try {
                removeHighlighting();
                console.log('Removed link highlighting');
                sendResponse({
                    success: true
                });
            } catch (error) {
                console.error('Error removing highlights:', error);
                sendResponse({
                    success: false,
                    error: error.message
                });
            }
        } else {
            console.log('Unknown action:', request.action);
            sendResponse({
                success: false,
                error: 'Unknown action: ' + request.action
            });
        }

        // Return true to indicate we will send a response asynchronously
        return true;
    });

    // Auto-scan when content script loads
    console.log('All Link Downloader: Content script loaded');

})();
