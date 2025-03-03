const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("api", {
  getLists: () => ipcRenderer.invoke('get-lists'),
  getList: (id) => ipcRenderer.invoke('get-list', id),
  addList: (label) => ipcRenderer.invoke('add-list', label),
  deleteList: (listId) => ipcRenderer.invoke("delete-list", listId),
  getListItems: (listId) => ipcRenderer.invoke('get-list-items', listId),
  addListItem: (listId, ankamaId, type) => ipcRenderer.invoke('add-list-item', listId, ankamaId, type),
  deleteListItem: (itemId) => ipcRenderer.invoke('delete-list-item', itemId),
  getItemPrice: (id) => ipcRenderer.invoke('get-item-price', id),
  addItemPrice: (ankamaId, value) => ipcRenderer.invoke('add-item-price', ankamaId, value),
  
  fetchDofusData: (endpoint) => ipcRenderer.invoke("fetch-dofus-data", endpoint)
});