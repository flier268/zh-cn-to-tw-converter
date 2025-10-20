const { contextBridge, ipcRenderer } = require("electron");

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld("api", {
  selectInputFile: () => ipcRenderer.invoke("select-input-file"),
  selectOutputFile: (defaultName) => ipcRenderer.invoke("select-output-file", defaultName),
  convertZip: (inputPath, outputPath) => ipcRenderer.invoke("convert-zip", inputPath, outputPath),
  onConversionProgress: (callback) => {
    ipcRenderer.on("conversion-progress", (event, progress) => callback(progress));
  },
});
