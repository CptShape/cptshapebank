const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("cptShapeDesktop", {
  getVersion: () => ipcRenderer.invoke("updater:get-version"),
  getUpdateState: () => ipcRenderer.invoke("updater:get-state"),
  checkForUpdates: () => ipcRenderer.invoke("updater:check"),
  downloadAndInstallUpdate: () => ipcRenderer.invoke("updater:download-install"),
  onUpdateState(listener) {
    const wrapped = (_event, payload) => listener(payload);
    ipcRenderer.on("updater:state", wrapped);
    return () => ipcRenderer.removeListener("updater:state", wrapped);
  },
});
