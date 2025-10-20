# Assets

Application icons for the ZH-CN to ZH-TW Converter.

## Files

- **icon.png** - 512x512 PNG for Linux AppImage (61 KB)
- **icon.ico** - Windows ICO file with multiple resolutions: 16x16, 32x32, 48x48, 256x256 (31 KB)

## Icon Design

The icon features:
- Blue-to-purple gradient background with subtle Minecraft-style isometric cube patterns
- Central white rounded rectangle containing:
  - "简" (simplified Chinese) in black
  - Blue arrow indicating conversion direction
  - "繁" (traditional Chinese) in purple
  - "ZH-CN → ZH-TW" subtitle
  - "Resource Pack Converter" description

## Regenerating Icons

If you need to regenerate the icons with design changes:

```bash
node generate-icon.js
```

This requires the `canvas` package (already installed as a dev dependency).
