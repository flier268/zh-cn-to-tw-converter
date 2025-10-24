const { contextBridge, ipcRenderer } = require("electron");

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld("api", {
  selectZipFile: () => ipcRenderer.invoke("select-zip-file"),
  selectInputFolder: () => ipcRenderer.invoke("select-input-folder"),
  selectOutputFile: (defaultName) => ipcRenderer.invoke("select-output-file", defaultName),
  selectOutputFolder: (defaultName) => ipcRenderer.invoke("select-output-folder", defaultName),
  convert: (inputPath, outputPath, isFolder, convertEnUs, convertNestedZip) =>
    ipcRenderer.invoke("convert", inputPath, outputPath, isFolder, convertEnUs, convertNestedZip),
  onConversionProgress: (callback) => {
    ipcRenderer.on("conversion-progress", (event, progress) => callback(progress));
  },
});
