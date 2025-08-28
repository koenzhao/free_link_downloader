# 🎨 Icon Creation Instructions

I've created several options for generating icons for your Chrome extension:

## 📁 Files Created:
- `icon.svg` - Master SVG icon file
- `icon-generator.html` - Visual icon preview (should have opened in your browser)
- `convert-icons.sh` - Automated conversion script
- `INSTRUCTIONS.md` - This file

## 🚀 Quick Methods (Choose One):

### Method 1: Automated Script (Recommended)
```bash
cd icons
./convert-icons.sh
```
*Requires: `brew install librsvg` or `brew install imagemagick`*

### Method 2: Online Converter (Easiest)
1. Go to [SVG to PNG Converter](https://cloudconvert.com/svg-to-png)
2. Upload the `icon.svg` file
3. Convert to these sizes:
   - 128×128 → save as `icon128.png`
   - 48×48 → save as `icon48.png`
   - 32×32 → save as `icon32.png`
   - 16×16 → save as `icon16.png`

### Method 3: Browser Screenshot (Manual)
1. Open `icon-generator.html` in your browser
2. Use browser dev tools to screenshot each icon
3. Save with correct filenames and sizes

### Method 4: Design Tool
1. Open `icon.svg` in:
   - Figma (free online)
   - Sketch
   - Adobe Illustrator
   - Inkscape (free)
2. Export as PNG in required sizes

## 📋 Required Files:
After conversion, you should have:
```
icons/
├── icon16.png   (16×16 pixels)
├── icon32.png   (32×32 pixels)
├── icon48.png   (48×48 pixels)
└── icon128.png  (128×128 pixels)
```

## 🔧 Final Step: Update Manifest
Once you have the PNG files, update `manifest.json`:

```json
{
  "action": {
    "default_popup": "popup.html",
    "default_title": "Free Link Downloader",
    "default_icon": {
      "16": "icons/icon16.png",
      "32": "icons/icon32.png",
      "48": "icons/icon48.png",
      "128": "icons/icon128.png"
    }
  },
  "icons": {
    "16": "icons/icon16.png",
    "32": "icons/icon32.png",
    "48": "icons/icon48.png",
    "128": "icons/icon128.png"
  }
}
```

## 🔄 Reload Extension
1. Go to `chrome://extensions/`
2. Find your extension
3. Click the reload button
4. Your custom icon should appear!

## 🎨 Icon Design
The icon features:
- **Chain links** (representing "links")
- **Download arrow** (representing "downloader")
- **Modern gradient** (matching your popup design)
- **Clean, scalable design** (works at all sizes)
