const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const path = require("path");
const fs = require("fs");
const { processZipFile, processFolderPath } = require("./converter");

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
    },
    icon: path.join(__dirname, "assets", "icon.png"),
  });

  mainWindow.loadFile("index.html");

  // Open DevTools in development mode
  if (process.env.NODE_ENV === "development") {
    mainWindow.webContents.openDevTools();
  }
}

app.whenReady().then(() => {
  createWindow();

  app.on("activate", function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", function () {
  if (process.platform !== "darwin") app.quit();
});

// Handle file or folder selection
ipcMain.handle("select-input-file", async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ["openFile", "openDirectory"],
    filters: [
      { name: "ZIP Files", extensions: ["zip"] },
      { name: "All Files", extensions: ["*"] },
    ],
  });

  if (!result.canceled && result.filePaths.length > 0) {
    const selectedPath = result.filePaths[0];
    const stats = fs.statSync(selectedPath);
    return {
      path: selectedPath,
      isFolder: stats.isDirectory(),
    };
  }
  return null;
});

// Handle save location selection for ZIP files
ipcMain.handle("select-output-file", async (event, defaultName) => {
  const result = await dialog.showSaveDialog(mainWindow, {
    defaultPath: defaultName,
    filters: [
      { name: "ZIP Files", extensions: ["zip"] },
      { name: "All Files", extensions: ["*"] },
    ],
  });

  if (!result.canceled && result.filePath) {
    return result.filePath;
  }
  return null;
});

// Handle save location selection for folders
ipcMain.handle("select-output-folder", async (event, defaultName) => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ["openDirectory", "createDirectory"],
    title: "選擇輸出資料夾",
    defaultPath: defaultName,
  });

  if (!result.canceled && result.filePaths.length > 0) {
    return result.filePaths[0];
  }
  return null;
});

// Handle conversion process for both ZIP files and folders
ipcMain.handle("convert", async (event, inputPath, outputPath, isFolder, convertEnUs) => {
  try {
    let stats;
    if (isFolder) {
      // Process folder
      stats = await processFolderPath(inputPath, outputPath, convertEnUs, (progress) => {
        // Send progress updates to renderer
        mainWindow.webContents.send("conversion-progress", progress);
      });
    } else {
      // Process ZIP file
      stats = await processZipFile(inputPath, outputPath, convertEnUs, (progress) => {
        // Send progress updates to renderer
        mainWindow.webContents.send("conversion-progress", progress);
      });
    }

    return { success: true, stats };
  } catch (error) {
    return { success: false, error: error.message };
  }
});
