# 🔗 Free Link Downloader - Chrome Extension

> [!NOTE]
> This extension was written by LLM (Claude4 in Cursor). The chat file can be found in the `chat` folder.

A powerful Chrome extension that finds and downloads all files from any webpage with one click. Perfect for bulk downloading documents, images, archives, and more.

## ✨ Key Features

- 🔍 **Smart Detection** - Automatically finds all downloadable files on any page
- ☑️ **Selective Downloads** - Choose which files to download with checkboxes
- 🔄 **Background Downloads** - Close the popup, downloads continue running
- 🛑 **Stop Anytime** - Cancel downloads with accurate progress reporting
- ⏱️ **Configurable Delays** - Be respectful to servers (0-5 second delays)
- 📊 **Real-time Progress** - Visual progress bar with file counts and percentages
- 🎯 **File Filtering** - Filter by Documents, Archives, Media, or Code files
- 🎨 **Modern UI** - Clean, responsive interface

## 🚀 Installation

1. **Download** this extension folder
2. **Open Chrome** → go to `chrome://extensions/`
3. **Enable "Developer mode"** (toggle in top-right)
4. **Click "Load unpacked"** → select the extension folder
5. **Pin the extension** (click puzzle icon → pin "Free Link Downloader")

## 📖 How to Use

1. **Go to any webpage** with downloadable files
2. **Click the extension icon** in your toolbar
3. **Wait for scan** - files appear automatically
4. **Select files** - use checkboxes to choose what to download
5. **Configure settings** (optional):
   - Filter by file type (Documents, Archives, Media, Code)
   - Set download delay (0-5 seconds between files)
6. **Click "📥 Download"** - files download in background
7. **Close popup if desired** - downloads continue running!

### 🎯 Background Downloads

**Key feature**: Downloads run independently - you can close the popup and browse other sites while files download in the background. Reopen the popup anytime to see progress or stop downloads.

## 🧪 Testing

**Quick test**: Open `test-page.html` in Chrome, click the extension icon, and try downloading the sample files.

**Real websites**: Try on documentation sites, software repositories, or any page with downloadable files.

## 🔧 Troubleshooting

**Extension won't load**:
- Enable "Developer mode" in `chrome://extensions/`
- Check for error messages in the extensions page
- Click "Reload" button next to the extension

**No files found**:
- Make sure the page has direct download links
- Try the included `test-page.html` to verify it works
- Some sites use JavaScript-generated links that aren't detected

**Downloads don't start**:
- Check Chrome's download settings
- Go to `chrome://extensions/` and click "service worker" to see logs
- Try reloading the extension

## 📁 Supported Files

- **📄 Documents**: PDF, DOC, XLS, PPT, TXT
- **📦 Archives**: ZIP, RAR, 7Z, TAR, GZ
- **🎵 Media**: MP3, MP4, JPG, PNG, GIF
- **💻 Code**: JS, CSS, JSON, XML, SQL

## 🛠️ Development

To modify the extension:
1. Edit files (`popup.html`, `popup.css`, `popup.js`)
2. Go to `chrome://extensions/` and click reload
3. Test your changes

**Useful resources**:
- [Chrome Extension Developer Guide](https://developer.chrome.com/docs/extensions/)
- [Extension API Reference](https://developer.chrome.com/docs/extensions/reference/)

---

**Built with ❤️ for efficient bulk downloading!**
