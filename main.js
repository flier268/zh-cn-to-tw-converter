const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const path = require("path");
const { processZipFile } = require("./converter");

// Disable sandbox for AppImage builds to avoid SUID sandbox issues
if (process.env.APPIMAGE) {
  app.commandLine.appendSwitch("no-sandbox");
}

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

// Handle file selection
ipcMain.handle("select-input-file", async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ["openFile"],
    filters: [
      { name: "ZIP Files", extensions: ["zip"] },
      { name: "All Files", extensions: ["*"] },
    ],
  });

  if (!result.canceled && result.filePaths.length > 0) {
    return result.filePaths[0];
  }
  return null;
});

// Handle save location selection
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

// Handle conversion process
ipcMain.handle("convert-zip", async (event, inputPath, outputPath) => {
  try {
    const stats = await processZipFile(inputPath, outputPath, (progress) => {
      // Send progress updates to renderer
      mainWindow.webContents.send("conversion-progress", progress);
    });

    return { success: true, stats };
  } catch (error) {
    return { success: false, error: error.message };
  }
});
