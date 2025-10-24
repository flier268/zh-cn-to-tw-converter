const { cn2tw_min } = require("cjk-conv/lib/zh/convert/min.js");
const Segment = require("novel-segment");
const AdmZip = require("adm-zip");
const path = require("path");
const fs = require("fs").promises;
const os = require("os");

// Initialize segmenter
const segment = new Segment({
  autoCjk: true,
  optionsDoSegment: {
    convertSynonym: true,
  },
  nodeNovelMode: true,
  all_mod: true,
});

segment.useDefault();

/**
 * Convert simplified Chinese text to traditional Chinese
 * @param {string} str - Input text in simplified Chinese
 * @returns {string} - Output text in traditional Chinese
 */
function convert(str) {
  return cn2tw_min(segment.doSegment(str, { simple: true }).join(""));
}

/**
 * Check if a file path should be converted based on its path
 * @param {string} filePath - File path to check
 * @param {boolean} convertEnUs - Whether to also convert en-us files
 * @returns {boolean} - True if file should be converted
 */
function shouldConvertFile(filePath, convertEnUs = false) {
  const lowerPath = filePath.toLowerCase();

  // Check if it's a language file (.json, .lang, or .snbt)
  if (!lowerPath.endsWith(".json") && !lowerPath.endsWith(".lang") && !lowerPath.endsWith(".snbt")) {
    return false;
  }

  // .snbt files don't have language flags, always convert them
  if (lowerPath.endsWith(".snbt")) {
    return true;
  }

  // OpenLoader support: convert all .json/.lang files in openloader directories
  // OpenLoader loads resources from config/openloader/resources/ or openloader/resources/
  if (lowerPath.includes("openloader/")) {
    return true;
  }

  // For .json and .lang files, check if it contains zh_cn or zh-cn in the path
  if (lowerPath.includes("zh_cn") || lowerPath.includes("zh-cn")) {
    return true;
  }

  // Optionally convert en-us files if the option is enabled
  if (convertEnUs && (lowerPath.includes("en_us") || lowerPath.includes("en-us"))) {
    return true;
  }

  return false;
}

/**
 * Preserve the case pattern of the original string
 * @param {string} original - Original string
 * @param {string} replacement - Replacement string in lowercase
 * @returns {string} - Replacement with same case pattern as original
 */
function preserveCase(original, replacement) {
  let result = '';
  for (let i = 0; i < replacement.length && i < original.length; i++) {
    const origChar = original[i];
    const replChar = replacement[i];

    if (origChar === origChar.toUpperCase() && origChar !== origChar.toLowerCase()) {
      // Original character is uppercase letter
      result += replChar.toUpperCase();
    } else {
      // Original character is lowercase or non-letter
      result += replChar.toLowerCase();
    }
  }
  // Append any remaining characters from replacement
  result += replacement.substring(original.length);
  return result;
}

/**
 * Convert file path from zh_cn/en_us to zh_tw or zh-cn/en-us to zh-tw
 * Preserves the original case pattern (zh_cn→zh_tw, zh_CN→zh_TW, ZH-CN→ZH-TW, etc.)
 * @param {string} filePath - Original file path
 * @returns {string} - Converted file path
 */
function convertFilePath(filePath) {
  // Replace zh_cn/zh-cn variants (preserving case and separator)
  let result = filePath.replace(/zh([_-])cn/gi, (match, separator) => {
    return preserveCase(match, `zh${separator}tw`);
  });

  // Replace en_us/en-us variants with zh_tw/zh-tw (preserving case and separator)
  result = result.replace(/en([_-])us/gi, (match, separator) => {
    return preserveCase(match, `zh${separator}tw`);
  });

  return result;
}

/**
 * Process a zip file: extract, convert zh_cn to zh_tw, and repack
 * @param {string} inputPath - Path to input zip file
 * @param {string} outputPath - Path to output zip file
 * @param {boolean} convertEnUs - Whether to also convert en-us files
 * @param {function} progressCallback - Callback function for progress updates
 * @returns {Promise<Object>} - Result object with stats
 */
async function processZipFile(inputPath, outputPath, convertEnUs = false, progressCallback = null) {
  const startTime = Date.now();
  const stats = {
    totalFiles: 0,
    convertedFiles: 0,
    skippedFiles: 0,
    errors: []
  };

  try {
    // Report progress
    if (progressCallback) progressCallback({ stage: "reading", message: "正在讀取 ZIP 檔案..." });

    // Read the input zip file
    const inputZip = new AdmZip(inputPath);
    const zipEntries = inputZip.getEntries();
    stats.totalFiles = zipEntries.length;

    // First pass: Check if there are any zh_cn/zh-cn files
    let hasZhCnFiles = false;
    for (const entry of zipEntries) {
      if (entry.isDirectory) continue;
      const lowerPath = entry.entryName.toLowerCase();
      if ((lowerPath.endsWith(".json") || lowerPath.endsWith(".lang")) &&
          (lowerPath.includes("zh_cn") || lowerPath.includes("zh-cn"))) {
        hasZhCnFiles = true;
        break;
      }
    }

    if (progressCallback) progressCallback({ stage: "processing", message: "正在處理檔案...", total: stats.totalFiles, current: 0 });

    // Create output zip
    const outputZip = new AdmZip();

    // Process each file in the zip
    for (let i = 0; i < zipEntries.length; i++) {
      const entry = zipEntries[i];

      if (entry.isDirectory) {
        // Handle directories - let adm-zip set sensible defaults
        const newPath = convertFilePath(entry.entryName);
        outputZip.addFile(newPath, Buffer.alloc(0));
        continue;
      }

      try {
        // Note: We don't pass the attr parameter because adm-zip doesn't handle it correctly
        // It will automatically set proper file permissions (0o100644 = rw-r--r--)

        // Determine if we should convert this file based on the new logic
        const lowerPath = entry.entryName.toLowerCase();
        const isEnUsFile = (lowerPath.endsWith(".json") || lowerPath.endsWith(".lang")) &&
                           (lowerPath.includes("en_us") || lowerPath.includes("en-us"));

        // Check if this file should be converted
        if (shouldConvertFile(entry.entryName, false)) {
          // This is a zh_cn file or snbt/openloader file - always convert
          const content = entry.getData().toString("utf8");
          const converted = convert(content);
          const newPath = convertFilePath(entry.entryName);

          // Add both original and converted versions (adm-zip will set proper permissions)
          outputZip.addFile(entry.entryName, entry.getData());
          outputZip.addFile(newPath, Buffer.from(converted, "utf8"));

          stats.convertedFiles++;
        } else if (convertEnUs && isEnUsFile && !hasZhCnFiles) {
          // Only convert en-us files if:
          // 1. convertEnUs is enabled
          // 2. This is an en-us file
          // 3. There are NO zh_cn files in the zip
          const content = entry.getData().toString("utf8");
          const converted = convert(content);

          // Replace the en-us file with converted content (keep original path)
          outputZip.addFile(entry.entryName, Buffer.from(converted, "utf8"));

          stats.convertedFiles++;
        } else {
          // Just copy the file as-is (adm-zip will set proper permissions)
          outputZip.addFile(entry.entryName, entry.getData());
          stats.skippedFiles++;
        }
      } catch (error) {
        stats.errors.push({ file: entry.entryName, error: error.message });
        // Still add the original file even if conversion fails
        outputZip.addFile(entry.entryName, entry.getData());
        stats.skippedFiles++;
      }

      if (progressCallback) {
        progressCallback({
          stage: "processing",
          message: `正在處理檔案... (${i + 1}/${stats.totalFiles})`,
          total: stats.totalFiles,
          current: i + 1
        });
      }
    }

    // Write the output zip file
    if (progressCallback) progressCallback({ stage: "writing", message: "正在寫入 ZIP 檔案..." });

    outputZip.writeZip(outputPath);

    const endTime = Date.now();
    stats.duration = ((endTime - startTime) / 1000).toFixed(2);

    if (progressCallback) progressCallback({ stage: "complete", message: "轉換完成！", stats });

    return stats;
  } catch (error) {
    if (progressCallback) progressCallback({ stage: "error", message: error.message });
    throw error;
  }
}

/**
 * Process a folder: recursively convert files and create output folder
 * @param {string} inputPath - Path to input folder
 * @param {string} outputPath - Path to output folder
 * @param {boolean} convertEnUs - Whether to also convert en-us files
 * @param {function} progressCallback - Callback function for progress updates
 * @returns {Promise<Object>} - Result object with stats
 */
async function processFolderPath(inputPath, outputPath, convertEnUs = false, progressCallback = null) {
  const startTime = Date.now();
  const stats = {
    totalFiles: 0,
    convertedFiles: 0,
    skippedFiles: 0,
    errors: []
  };

  try {
    // Report progress
    if (progressCallback) progressCallback({ stage: "reading", message: "正在讀取資料夾..." });

    // Recursively get all files in the input folder
    const allFiles = [];
    async function walkDir(dir, baseDir = dir) {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          await walkDir(fullPath, baseDir);
        } else {
          // Store relative path from base directory
          const relativePath = path.relative(baseDir, fullPath);
          allFiles.push({ fullPath, relativePath });
        }
      }
    }

    await walkDir(inputPath);
    stats.totalFiles = allFiles.length;

    // First pass: Check if there are any zh_cn/zh-cn files
    let hasZhCnFiles = false;
    for (const { relativePath } of allFiles) {
      const lowerPath = relativePath.toLowerCase();
      if ((lowerPath.endsWith(".json") || lowerPath.endsWith(".lang")) &&
          (lowerPath.includes("zh_cn") || lowerPath.includes("zh-cn"))) {
        hasZhCnFiles = true;
        break;
      }
    }

    if (progressCallback) progressCallback({ stage: "processing", message: "正在處理檔案...", total: stats.totalFiles, current: 0 });

    // Process each file
    for (let i = 0; i < allFiles.length; i++) {
      const { fullPath, relativePath } = allFiles[i];

      try {
        // Create output directory structure
        const outputFilePath = path.join(outputPath, relativePath);
        const outputDir = path.dirname(outputFilePath);
        await fs.mkdir(outputDir, { recursive: true });

        // Determine if we should convert this file based on the new logic
        const lowerPath = relativePath.toLowerCase();
        const isEnUsFile = (lowerPath.endsWith(".json") || lowerPath.endsWith(".lang")) &&
                           (lowerPath.includes("en_us") || lowerPath.includes("en-us"));

        // Check if this file should be converted
        if (shouldConvertFile(relativePath, false)) {
          // This is a zh_cn file or snbt/openloader file - always convert
          const content = await fs.readFile(fullPath, "utf8");
          const converted = convert(content);
          const newRelativePath = convertFilePath(relativePath);
          const newOutputPath = path.join(outputPath, newRelativePath);
          const newOutputDir = path.dirname(newOutputPath);

          // Create directory for converted file if needed
          await fs.mkdir(newOutputDir, { recursive: true });

          // Write both original and converted versions
          await fs.copyFile(fullPath, outputFilePath);
          await fs.writeFile(newOutputPath, converted, "utf8");

          stats.convertedFiles++;
        } else if (convertEnUs && isEnUsFile && !hasZhCnFiles) {
          // Only convert en-us files if:
          // 1. convertEnUs is enabled
          // 2. This is an en-us file
          // 3. There are NO zh_cn files in the folder
          const content = await fs.readFile(fullPath, "utf8");
          const converted = convert(content);

          // Replace the en-us file with converted content (keep original path)
          await fs.writeFile(outputFilePath, converted, "utf8");

          stats.convertedFiles++;
        } else {
          // Just copy the file as-is
          await fs.copyFile(fullPath, outputFilePath);
          stats.skippedFiles++;
        }
      } catch (error) {
        stats.errors.push({ file: relativePath, error: error.message });
        // Try to copy the original file even if conversion fails
        try {
          const outputFilePath = path.join(outputPath, relativePath);
          await fs.copyFile(fullPath, outputFilePath);
        } catch (copyError) {
          // Ignore copy errors
        }
        stats.skippedFiles++;
      }

      if (progressCallback) {
        progressCallback({
          stage: "processing",
          message: `正在處理檔案... (${i + 1}/${stats.totalFiles})`,
          total: stats.totalFiles,
          current: i + 1
        });
      }
    }

    const endTime = Date.now();
    stats.duration = ((endTime - startTime) / 1000).toFixed(2);

    if (progressCallback) progressCallback({ stage: "complete", message: "轉換完成！", stats });

    return stats;
  } catch (error) {
    if (progressCallback) progressCallback({ stage: "error", message: error.message });
    throw error;
  }
}

module.exports = {
  convert,
  shouldConvertFile,
  convertFilePath,
  processZipFile,
  processFolderPath
};
