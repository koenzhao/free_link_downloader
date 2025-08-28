#!/bin/bash
# Convert SVG to PNG icons for Chrome extension
# Requires ImageMagick (brew install imagemagick) or librsvg (brew install librsvg)

echo "🎨 Converting SVG to PNG icons..."

# Check if we have the tools needed
if command -v rsvg-convert >/dev/null 2>&1; then
    echo "✅ Using rsvg-convert"
    CONVERTER="rsvg"
elif command -v convert >/dev/null 2>&1; then
    echo "✅ Using ImageMagick convert"
    CONVERTER="imagemagick"
else
    echo "❌ Neither rsvg-convert nor ImageMagick found!"
    echo "Install with: brew install librsvg  OR  brew install imagemagick"
    exit 1
fi

# Create the PNG files
if [ "$CONVERTER" = "rsvg" ]; then
    rsvg-convert -w 128 -h 128 icon.svg -o icon128.png
    rsvg-convert -w 48 -h 48 icon.svg -o icon48.png
    rsvg-convert -w 32 -h 32 icon.svg -o icon32.png
    rsvg-convert -w 16 -h 16 icon.svg -o icon16.png
else
    convert -background none -size 128x128 icon.svg icon128.png
    convert -background none -size 48x48 icon.svg icon48.png
    convert -background none -size 32x32 icon.svg icon32.png
    convert -background none -size 16x16 icon.svg icon16.png
fi

echo "✅ Icon files created:"
ls -la *.png 2>/dev/null || echo "❌ No PNG files found - conversion may have failed"

echo ""
echo "🚀 Next steps:"
echo "1. Check that all PNG files were created successfully"
echo "2. Update manifest.json to include the icon references"
echo "3. Reload your Chrome extension"
