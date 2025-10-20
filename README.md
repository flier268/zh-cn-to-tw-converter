# ZH-CN to ZH-TW Converter

A cross-platform GUI application to convert Minecraft resource packs from Simplified Chinese (zh-CN) to Traditional Chinese (zh-TW).

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

## Features

- **Easy-to-use GUI**: Simple drag-and-drop interface
- **Automatic conversion**: Converts all zh_cn/zh-cn language files to zh_tw/zh-tw
- **SNBT support**: Automatically converts all .snbt files (FTB Quests, etc.)
- **Progress tracking**: Real-time progress bar and status updates
- **Cross-platform**: Available for Windows (.exe) and Linux (AppImage)
- **Smart processing**: Preserves original files while adding converted versions
- **Detailed statistics**: Shows conversion results and errors

## Download

### Pre-built Binaries

Download the latest release from the [Releases](https://github.com/YOUR_USERNAME/zh-cn-to-tw-converter/releases) page:

- **Windows**: Download `.exe` installer
- **Linux**: Download `.AppImage` file

### Linux Setup

Make the AppImage executable:

```bash
chmod +x ZH-CN-to-ZH-TW-Converter-*.AppImage
./ZH-CN-to-ZH-TW-Converter-*.AppImage
```

## Usage

1. **Launch the application**
2. **Select input file**: Click "選擇 ZIP 檔案" to choose your Minecraft resource pack
3. **Choose output location**: Click "選擇儲存位置" or use the auto-generated filename
4. **Start conversion**: Click "開始轉換" to begin the process
5. **Wait for completion**: Monitor the progress bar
6. **Check results**: View conversion statistics and any errors

## How It Works

The converter:

1. **Extracts** the ZIP file contents
2. **Identifies** all Chinese language files:
   - **JSON/LANG files** (requires language flag in path):
     - Files matching `**/zh_cn/**/*.{json,lang}` → `**/zh_tw/**/*.{json,lang}`
     - Files matching `**/zh_cn.{json,lang}` → `**/zh_tw.{json,lang}`
     - Files matching `**/zh-cn/**/*.{json,lang}` → `**/zh-tw/**/*.{json,lang}`
     - Files matching `**/zh-cn.{json,lang}` → `**/zh-tw.{json,lang}`
     - Files matching `**/zh_CN/**/*.{json,lang}` → `**/zh_TW/**/*.{json,lang}`
     - Files matching `**/zh-CN/**/*.{json,lang}` → `**/zh-TW/**/*.{json,lang}`
     - (All case variations are supported)
   - **SNBT files** (always converted, no language flag required):
     - All files ending with `.snbt` extension
     - Commonly used in FTB Quests and other mods for quest data
3. **Converts** text using:
   - **cjk-conv**: Chinese character conversion library
   - **novel-segment**: Word segmentation for better accuracy
4. **Creates** converted files:
   - **JSON/LANG**: Creates parallel zh_tw/zh-tw files alongside originals
   - **SNBT**: Converts in-place (no separate zh_tw version)
5. **Repackages** everything into a new ZIP file

## Development

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/zh-cn-to-tw-converter.git
cd zh-cn-to-tw-converter

# Install dependencies
npm install
```

### Running in Development

```bash
npm start
```

### Building

Build for your current platform:

```bash
npm run build
```

Build for specific platforms:

```bash
# Windows
npm run build:win

# Linux AppImage
npm run build:linux

# All platforms
npm run build:all
```

Built files will be in the `dist/` directory.

## Project Structure

```
zh-cn-to-tw-converter/
├── .github/
│   └── workflows/
│       └── build.yml          # GitHub Actions CI/CD
├── assets/
│   ├── icon.png               # Linux icon (512x512)
│   ├── icon.ico               # Windows icon
│   └── README.md              # Icon guidelines
├── converter.js               # Core conversion logic
├── main.js                    # Electron main process
├── preload.js                 # Electron preload script
├── renderer.js                # UI interaction logic
├── index.html                 # Main interface
├── styles.css                 # Application styling
├── package.json               # Project configuration
├── .gitignore                 # Git ignore rules
└── README.md                  # This file
```

## Technology Stack

- **Electron**: Cross-platform desktop framework
- **cjk-conv**: Chinese character conversion
- **novel-segment**: Chinese word segmentation
- **adm-zip**: ZIP file manipulation
- **electron-builder**: Application packaging

## Configuration

### Electron Builder

The build configuration in `package.json` includes:

- **Windows**: NSIS installer with customization options
- **Linux**: AppImage with proper categorization
- **Output**: All builds go to `dist/` directory

### Adding Icons

Place your custom icons in the `assets/` directory:

- `icon.png`: 512x512 PNG for Linux
- `icon.ico`: Multi-resolution ICO for Windows

## CI/CD

The project uses GitHub Actions for automated builds:

- **Triggers**: Push to main/master, tags (v*), manual workflow dispatch
- **Build matrix**: Windows and Linux in parallel
- **Artifacts**: Automatically uploaded for each build
- **Releases**: Auto-created when pushing version tags

### Creating a Release

```bash
# Tag the version
git tag v1.0.0
git push origin v1.0.0

# GitHub Actions will automatically build and create a release
```

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Related Projects

- [Minecraft-Mod-Language-Package](https://github.com/CFPAOrg/Minecraft-Mod-Language-Package) - Upstream simplified Chinese language pack
- [cjk-conv](https://github.com/bluelovers/ws-regexp/tree/master/packages/cjk-conv) - CJK character conversion library

## Support

If you encounter any issues or have questions:

1. Check the [Issues](https://github.com/YOUR_USERNAME/zh-cn-to-tw-converter/issues) page
2. Create a new issue with detailed information
3. Include error messages and steps to reproduce

## Acknowledgments

- Conversion logic adapted from the [Minecraft-Mod-Traditional-Chinese-Language-Package](https://github.com/CFPAOrg/Minecraft-Mod-Traditional-Chinese-Language-Package) project
- Uses Chinese conversion libraries: cjk-conv and novel-segment
