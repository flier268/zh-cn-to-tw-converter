let inputFilePath = null;
let outputFilePath = null;

const selectInputBtn = document.getElementById("selectInputBtn");
const selectOutputBtn = document.getElementById("selectOutputBtn");
const convertBtn = document.getElementById("convertBtn");
const inputFilePathDisplay = document.getElementById("inputFilePath");
const outputFilePathDisplay = document.getElementById("outputFilePath");
const progressSection = document.getElementById("progressSection");
const progressBar = document.getElementById("progressBar");
const progressMessage = document.getElementById("progressMessage");
const resultSection = document.getElementById("resultSection");
const resultContent = document.getElementById("resultContent");

// Select input file
selectInputBtn.addEventListener("click", async () => {
  const filePath = await window.api.selectInputFile();
  if (filePath) {
    inputFilePath = filePath;
    inputFilePathDisplay.textContent = filePath;
    selectOutputBtn.disabled = false;

    // Auto-generate output filename
    const fileName = filePath.split(/[\\/]/).pop().replace(".zip", "");
    const suggestedName = `${fileName}-zh_tw.zip`;
    const outputPath = filePath.replace(/[^/\\]+$/, suggestedName);
    outputFilePath = outputPath;
    outputFilePathDisplay.textContent = outputPath;
    convertBtn.disabled = false;
  }
});

// Select output file
selectOutputBtn.addEventListener("click", async () => {
  if (!inputFilePath) return;

  const fileName = inputFilePath.split(/[\\/]/).pop().replace(".zip", "");
  const suggestedName = `${fileName}-zh_tw.zip`;

  const filePath = await window.api.selectOutputFile(suggestedName);
  if (filePath) {
    outputFilePath = filePath;
    outputFilePathDisplay.textContent = filePath;
    convertBtn.disabled = false;
  }
});

// Convert button
convertBtn.addEventListener("click", async () => {
  if (!inputFilePath || !outputFilePath) return;

  // Disable buttons during conversion
  selectInputBtn.disabled = true;
  selectOutputBtn.disabled = true;
  convertBtn.disabled = true;

  // Show progress section
  progressSection.classList.remove("hidden");
  resultSection.classList.add("hidden");
  progressBar.style.width = "0%";
  progressBar.textContent = "";

  try {
    const result = await window.api.convertZip(inputFilePath, outputFilePath);

    if (result.success) {
      showResult(result.stats);
    } else {
      showError(result.error);
    }
  } catch (error) {
    showError(error.message);
  } finally {
    // Re-enable buttons
    selectInputBtn.disabled = false;
    selectOutputBtn.disabled = false;
    convertBtn.disabled = false;
  }
});

// Listen for progress updates
window.api.onConversionProgress((progress) => {
  if (progress.stage === "processing") {
    const percentage = Math.round((progress.current / progress.total) * 100);
    progressBar.style.width = `${percentage}%`;
    progressBar.textContent = `${percentage}%`;
    progressMessage.textContent = progress.message;
  } else {
    progressMessage.textContent = progress.message;
  }
});

function showResult(stats) {
  progressSection.classList.add("hidden");
  resultSection.classList.remove("hidden");

  let html = `
    <h3 style="color: #48bb78; margin-bottom: 15px;">轉換成功！</h3>
    <p style="margin-bottom: 15px;">檔案已儲存至：<br><strong>${outputFilePath}</strong></p>
    <div class="result-stats">
      <div class="stat-item">
        <div class="stat-label">總檔案數</div>
        <div class="stat-value">${stats.totalFiles}</div>
      </div>
      <div class="stat-item">
        <div class="stat-label">已轉換</div>
        <div class="stat-value" style="color: #48bb78;">${stats.convertedFiles}</div>
      </div>
      <div class="stat-item">
        <div class="stat-label">已跳過</div>
        <div class="stat-value" style="color: #999;">${stats.skippedFiles}</div>
      </div>
      <div class="stat-item">
        <div class="stat-label">耗時</div>
        <div class="stat-value" style="color: #667eea;">${stats.duration}s</div>
      </div>
    </div>
  `;

  if (stats.errors && stats.errors.length > 0) {
    html += `
      <div style="margin-top: 20px;">
        <h4 style="color: #f56565; margin-bottom: 10px;">錯誤 (${stats.errors.length})</h4>
        <div class="error-list">
          ${stats.errors
            .map(
              (err) => `
            <div class="error-item">
              <div class="error-file">${err.file}</div>
              <div class="error-message">${err.error}</div>
            </div>
          `
            )
            .join("")}
        </div>
      </div>
    `;
  }

  resultContent.innerHTML = html;
  resultContent.classList.remove("error");
}

function showError(errorMessage) {
  progressSection.classList.add("hidden");
  resultSection.classList.remove("hidden");

  resultContent.innerHTML = `
    <h3 style="color: #f56565; margin-bottom: 15px;">轉換失敗</h3>
    <p style="color: #666;">${errorMessage}</p>
  `;
  resultContent.classList.add("error");
}
