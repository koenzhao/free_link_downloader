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

    // MIME type to file extension mapping for data URIs
    const MIME_TO_EXTENSION = {
        // Documents
        'text/plain': 'txt',
        'text/csv': 'csv',
        'application/pdf': 'pdf',
        'application/msword': 'doc',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
        'application/vnd.ms-excel': 'xls',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
        'application/vnd.ms-powerpoint': 'ppt',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',

        // Archives
        'application/zip': 'zip',
        'application/x-rar-compressed': 'rar',
        'application/x-7z-compressed': '7z',
        'application/x-tar': 'tar',
        'application/gzip': 'gz',

        // Media
        'image/jpeg': 'jpg',
        'image/png': 'png',
        'image/gif': 'gif',
        'image/bmp': 'bmp',
        'image/svg+xml': 'svg',
        'image/webp': 'webp',
        'audio/mpeg': 'mp3',
        'audio/wav': 'wav',
        'video/mp4': 'mp4',
        'video/avi': 'avi',

        // Code & Data
        'text/javascript': 'js',
        'application/javascript': 'js',
        'text/css': 'css',
        'text/html': 'html',
        'application/json': 'json',
        'application/xml': 'xml',
        'text/xml': 'xml'
    };

    // Function to extract file extension from URL or download attribute
    function getFileExtension(url, downloadAttr = null) {
        // First, try to get extension from download attribute
        if (downloadAttr) {
            const match = downloadAttr.match(/\.([^./?#]+)$/i);
            if (match) {
                return match[1].toLowerCase();
            }
        }

        try {
            // Handle data URIs
            if (url.startsWith('data:')) {
                const mimeMatch = url.match(/^data:([^;,]+)/i);
                if (mimeMatch) {
                    const mimeType = mimeMatch[1].toLowerCase();
                    return MIME_TO_EXTENSION[mimeType] || null;
                }
                return null;
            }

            // Handle regular URLs
            const urlObj = new URL(url);
            const pathname = urlObj.pathname;
            const match = pathname.match(/\.([^./?#]+)(?:[?#]|$)/i);
            return match ? match[1].toLowerCase() : null;
        } catch (e) {
            return null;
        }
    }

    // Function to check if a link is a downloadable file
    function isDownloadableFile(linkElement) {
        const url = linkElement.href;
        const downloadAttr = linkElement.getAttribute('download');

        // If it has a download attribute, it's definitely intended for download
        if (downloadAttr) {
            const extension = getFileExtension(url, downloadAttr);
            return extension && FILE_EXTENSIONS.includes(extension);
        }

        // Otherwise check if URL has a downloadable extension
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
            if (!isDownloadableFile(link)) {
                return;
            }

            // Extract information about the link
            const downloadAttr = link.getAttribute('download');
            const extension = getFileExtension(href, downloadAttr);

            // Get filename from download attribute or URL
            let fileName;
            if (downloadAttr) {
                fileName = downloadAttr;
            } else if (href.startsWith('data:')) {
                // For data URIs, generate a filename based on content
                fileName = `file_${index}.${extension}`;
            } else {
                // For regular URLs, extract from path
                fileName = href.split('/').pop().split('?')[0] || `file_${index}.${extension}`;
            }

            const linkText = link.textContent.trim() || fileName;
            const fileSize = getFileSizeFromText(link);

            // Get surrounding context for better identification
            const parent = link.parentElement;
            const context = parent ? parent.textContent.trim().substring(0, 100) : '';

            console.log(`Found downloadable file: ${fileName} (${extension}) - ${href.substring(0, 50)}...`);

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
            if (isDownloadableFile(link)) {
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
            if (isDownloadableFile(link)) {
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
