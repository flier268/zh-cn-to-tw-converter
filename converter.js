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
 * @returns {boolean} - True if file should be converted
 */
function shouldConvertFile(filePath) {
  const lowerPath = filePath.toLowerCase();

  // Check if it's a language file (.json, .lang, or .snbt)
  if (!lowerPath.endsWith(".json") && !lowerPath.endsWith(".lang") && !lowerPath.endsWith(".snbt")) {
    return false;
  }

  // .snbt files don't have language flags, always convert them
  if (lowerPath.endsWith(".snbt")) {
    return true;
  }

  // For .json and .lang files, check if it contains zh_cn or zh-cn in the path
  return lowerPath.includes("zh_cn") || lowerPath.includes("zh-cn");
}

/**
 * Convert file path from zh_cn to zh_tw or zh-cn to zh-tw
 * @param {string} filePath - Original file path
 * @returns {string} - Converted file path
 */
function convertFilePath(filePath) {
  return filePath
    .replace(/zh_cn/g, "zh_tw")
    .replace(/zh-cn/g, "zh-tw")
    .replace(/zh_CN/g, "zh_TW")
    .replace(/zh-CN/g, "zh-TW");
}

/**
 * Process a zip file: extract, convert zh_cn to zh_tw, and repack
 * @param {string} inputPath - Path to input zip file
 * @param {string} outputPath - Path to output zip file
 * @param {function} progressCallback - Callback function for progress updates
 * @returns {Promise<Object>} - Result object with stats
 */
async function processZipFile(inputPath, outputPath, progressCallback = null) {
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

        // Check if this file should be converted
        if (shouldConvertFile(entry.entryName)) {
          // Read and convert the file
          const content = entry.getData().toString("utf8");
          const converted = convert(content);
          const newPath = convertFilePath(entry.entryName);

          // Add both original and converted versions (adm-zip will set proper permissions)
          outputZip.addFile(entry.entryName, entry.getData());
          outputZip.addFile(newPath, Buffer.from(converted, "utf8"));

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

module.exports = {
  convert,
  shouldConvertFile,
  convertFilePath,
  processZipFile
};
