const { contextBridge, ipcRenderer } = require("electron");

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld("api", {
  selectInputFile: () => ipcRenderer.invoke("select-input-file"),
  selectOutputFile: (defaultName) => ipcRenderer.invoke("select-output-file", defaultName),
  selectOutputFolder: (defaultName) => ipcRenderer.invoke("select-output-folder", defaultName),
  convert: (inputPath, outputPath, isFolder, convertEnUs, convertNestedZip) =>
    ipcRenderer.invoke("convert", inputPath, outputPath, isFolder, convertEnUs, convertNestedZip),
  onConversionProgress: (callback) => {
    ipcRenderer.on("conversion-progress", (event, progress) => callback(progress));
  },
});
