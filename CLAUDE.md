# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an Electron-based GUI application that converts Minecraft resource packs from Simplified Chinese (zh-CN) to Traditional Chinese (zh-TW). The application extracts ZIP files, converts language files using Chinese character conversion libraries, and repackages them with both original and converted files.

## Commands

### Development

```bash
# Install dependencies
npm install

# Run in development mode
npm start
```

### Testing

```bash
# Run unit tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

The test suite (`converter.test.js`) covers:
- Text conversion (simplified → traditional Chinese)
- File path detection and conversion logic
- ZIP file processing
- Folder processing
- en_us conversion behavior

### Building

```bash
# Build for current platform
npm run build

# Build for Windows only
npm run build:win

# Build for Linux AppImage only
npm run build:linux

# Build for all platforms
npm run build:all
```

Built files are output to the `dist/` directory.

## Architecture

### Electron Multi-Process Architecture

The application follows the standard Electron pattern with three main processes:

1. **Main Process** (`main.js`)
   - Creates the BrowserWindow
   - Handles IPC communication with renderer
   - Manages file dialogs (input/output selection)
   - Coordinates the conversion process
   - Sends progress updates back to renderer

2. **Preload Script** (`preload.js`)
   - Bridges main and renderer processes
   - Exposes safe IPC channels via `contextBridge`
   - Provides: `selectInputFile()`, `selectOutputFile()`, `selectOutputFolder()`, `convert()`, `onConversionProgress()`

3. **Renderer Process** (`renderer.js`)
   - Handles UI interactions
   - Updates progress bars and result displays
   - Manages button states during conversion
   - Handles both ZIP file and folder input selection

### Core Conversion Logic (`converter.js`)

The conversion pipeline consists of:

1. **Text Conversion** (`convert()` function)
   - Uses `novel-segment` to segment Chinese text for better context
   - Applies `cjk-conv` library's `cn2tw_min` function for character conversion
   - Segments first, then converts: `cn2tw_min(segment.doSegment(str).join(""))`

2. **File Detection** (`shouldConvertFile()` function)
   - **SNBT files** (`.snbt`): Always converted (no language flag required)
   - **OpenLoader files**: All `.json`/`.lang` files in `openloader/` directories
   - **Language files**: `.json`/`.lang` files with `zh_cn` or `zh-cn` in path
   - **Optional en_us conversion**: When enabled and NO zh_cn files exist, converts `en_us`/`en-us` files

3. **Path Conversion** (`convertFilePath()` function)
   - Replaces all variations: `zh_cn` → `zh_tw`, `zh-cn` → `zh-tw`, `zh_CN` → `zh_TW`, `zh-CN` → `zh-TW`
   - Also converts: `en_us` → `zh_tw`, `en-us` → `zh-tw` (when applicable)
   - Preserves original case pattern using `preserveCase()` helper

4. **ZIP Processing** (`processZipFile()` function)
   - Extracts ZIP entries using `adm-zip`
   - Processes each file: directories, convertible files, and regular files
   - **Important**: Adds BOTH original and converted versions to output ZIP
   - SNBT files are converted in-place (no separate zh_tw version)
   - Reports progress via callback with stages: reading, processing, writing, complete, error

5. **Folder Processing** (`processFolderPath()` function)
   - Recursively walks directory tree to find all files
   - Applies same conversion logic as ZIP processing
   - Creates parallel directory structure in output folder
   - Preserves file permissions and directory hierarchy

### File Processing Strategy

- **Language files** (`.json`, `.lang`): Creates parallel zh_tw/zh-tw files alongside zh_cn/zh-cn originals
- **SNBT files**: Converts in-place without creating separate zh_tw versions
- **OpenLoader files**: All `.json`/`.lang` files in `openloader/` directories are converted regardless of naming
- **en_us files**: Only converted when the `convertEnUs` checkbox is enabled AND no zh_cn files exist in the resource pack
- **Other files**: Copied as-is to output ZIP/folder

### Input Support

The application supports two types of input:

1. **ZIP Files** - Minecraft resource pack ZIP files
   - Output: New ZIP file with suffix `-zh_tw.zip`
   - Contains both original and converted files

2. **Folders** - Extracted resource pack directories
   - Output: New folder with suffix `-zh_tw`
   - Useful for development and testing without repackaging

## Key Dependencies

- **electron**: Desktop application framework
- **cjk-conv**: Chinese character conversion (uses `cn2tw_min` for simplified → traditional)
- **novel-segment**: Chinese word segmentation for better conversion quality
- **adm-zip**: ZIP file manipulation (extraction and creation)
- **electron-builder**: Packaging for Windows (.exe) and Linux (AppImage)
- **jest**: Unit testing framework
- **canvas**: Required by electron-builder for icon generation

## CI/CD

GitHub Actions workflow (`.github/workflows/build.yml`):

- **Triggers**: Push to main/master, version tags (`v*`), pull requests, manual dispatch
- **Build matrix**: Parallel builds for Windows and Linux
- **Release**: Auto-creates GitHub releases when pushing version tags
- **Artifacts**: Uploads `.exe` (Windows) and `.AppImage` (Linux) files

To create a release:

```bash
git tag v1.0.1
git push origin v1.0.1
# GitHub Actions will build and create the release automatically
```

## Development Notes

### Electron Security

The app follows Electron security best practices:
- `nodeIntegration: false` - Prevents Node.js in renderer
- `contextIsolation: true` - Isolates preload script context
- Preload script uses `contextBridge` to expose limited IPC APIs

### Linux AppImage Sandbox Fix

The AppImage build includes an automatic sandbox fix (`appimage-fix.js`) that runs during the build process:
- Renames the Electron executable to `.bin`
- Creates a shell wrapper that launches with `--no-sandbox` flag
- Enables user namespace sandboxing (secure, no root required)
- Solves the common SUID sandbox error in AppImages mounted on `nosuid` filesystems

### Testing Conversion Logic

When testing conversion logic changes:
1. Write unit tests in `converter.test.js` for new features
2. Run `npm test` to verify all tests pass
3. For manual testing, use the GUI with sample ZIP files or folders

### OpenLoader Support

OpenLoader is a Minecraft mod that loads resources from specific directories:
- Modern path: `config/openloader/resources/`
- Legacy path: `openloader/resources/`

The converter automatically detects and converts ALL `.json` and `.lang` files in these directories, regardless of whether they have language flags in their names.

### SNBT Files

SNBT (Structured NBT) files are commonly used by FTB Quests and other mods. These files:
- Always get converted (no language flag check required)
- Are converted in-place rather than creating separate zh_tw versions
- Use the same text conversion pipeline as JSON/LANG files

### en_us Conversion Feature

The application includes an optional feature to convert English files to Traditional Chinese:
- Enabled via the "同時轉換英文翻譯為繁體中文" checkbox in the UI
- Only activates when NO zh_cn files exist in the resource pack
- Replaces en_us/en-us content with converted Traditional Chinese text
- Useful for mods that only provide English translations (converts English → Simplified Chinese detection → Traditional Chinese)
- **Note**: The conversion quality depends on whether the English text contains Chinese characters that can be converted
