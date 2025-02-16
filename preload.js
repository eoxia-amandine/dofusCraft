const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("api", {
  getLists: () => ipcRenderer.invoke('get-lists'),
  getList: (id) => ipcRenderer.invoke('get-list', id),
  addList: (label) => ipcRenderer.invoke('add-list', label),
  getListItems: (listId) => ipcRenderer.invoke('get-list-items', listId),
  addListItem: (listId, ankamaId, type) => ipcRenderer.invoke('add-list-item', listId, ankamaId, type),
  getItemPrice: (id) => ipcRenderer.invoke('get-item-price', id),
  addItemPrice: (id, value) => ipcRenderer.invoke('add-item-price', id, value),
  
  fetchDofusData: (endpoint) => ipcRenderer.invoke("fetch-dofus-data", endpoint)
});