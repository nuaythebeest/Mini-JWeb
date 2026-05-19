const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("miniJweb", {
  inspectDevice: (connection) => ipcRenderer.invoke("device:inspect", connection),
  getSnapshot: (connection) => ipcRenderer.invoke("device:snapshot", connection),
  getActiveConfig: (connection) => ipcRenderer.invoke("device:activeConfig", connection),
  getMonitor: (payload) => ipcRenderer.invoke("device:monitor", payload),
  runAction: (payload) => ipcRenderer.invoke("device:action", payload),
  revertCandidate: (connection) => ipcRenderer.invoke("device:revert", connection),
  commitCheck: (payload) => ipcRenderer.invoke("device:commitCheck", payload),
  commit: (payload) => ipcRenderer.invoke("device:commit", payload),
  chooseFirmwareFile: () => ipcRenderer.invoke("firmware:chooseFile"),
  checkFirmwareRemoteFile: (payload) => ipcRenderer.invoke("firmware:checkRemoteFile", payload),
  uploadFirmware: (payload) => ipcRenderer.invoke("firmware:upload", payload),
  onFirmwareUploadProgress: (callback) => {
    const listener = (_event, progress) => callback(progress);
    ipcRenderer.on("firmware:uploadProgress", listener);
    return () => ipcRenderer.removeListener("firmware:uploadProgress", listener);
  }
});
