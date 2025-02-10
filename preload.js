const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("api", {
  addPlayer: (name) => ipcRenderer.invoke("add-player", name),
  getPlayers: () => ipcRenderer.invoke("get-players"),
  fetchDofusData: (endpoint) => ipcRenderer.invoke("fetch-dofus-data", endpoint)
});