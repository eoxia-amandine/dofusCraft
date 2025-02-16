const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const db = require("./db/database");
const axios = require("axios");

const createWindow = () => {
  const win = new BrowserWindow({
    width: 1280,
    height: 720,
    webPreferences: {
      nodeIntegration: false, // Désactiver l'accès direct à Node.js pour la sécurité
      contextIsolation: true,
      preload: path.join(__dirname, "preload.js"), // Utiliser un preload pour la communication
    },
  })

  //const startURL =
  //process.env.NODE_ENV === "development"
  //  ? "http://localhost:5173"
  //  : `file://${path.join(__dirname, "../build/index.html")}`;

  const startURL = app.isPackaged
    ? `file://${path.join(__dirname, "dist/index.html")}` // En production
    : "http://localhost:5173"; // En développement

  win.loadURL(startURL);
  win.webContents.openDevTools();

}

app.whenReady().then(() => {
    createWindow()

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })
})

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit()
  })


// Get all lists
ipcMain.handle("get-lists", async () => {
  const stmt = db.prepare("SELECT * FROM list");
  return stmt.all();
});

// Get list
ipcMain.handle("get-list", async (event, id) => {
  const stmt = db.prepare("SELECT * FROM listItem WHERE id = ?");
  return stmt.get(id);
});

// Add list
ipcMain.handle("add-list", async (event, label) => {
  const stmt = db.prepare("INSERT INTO list (label) VALUES (?)");
  stmt.run(label);
  return stmt.lastInsertRowid;
});

// Get items by listId
ipcMain.handle("get-list-items", async (event, listId) => {
  const stmt = db.prepare("SELECT * FROM listItem WHERE listId = ?");
  return stmt.all(listId);
});

// Add list item
ipcMain.handle("add-list-item", async (event, listId, ankamaId, type) => {
  const stmt = db.prepare("INSERT INTO listItem (listId, ankamaId, type) VALUES (?, ?, ?)");
  stmt.run(listId, ankamaId, type);
  return stmt.lastInsertRowid;
});

// get item price
ipcMain.handle("get-item-price", async (event, id) => {
  const stmt = db.prepare("SELECT value FROM price WHERE id = ?");
  return stmt.get(id);
});

// Add item price
ipcMain.handle("add-item-price", async (event, id, value) => {
  const stmt = db.prepare("INSERT INTO price (id, value) VALUES (?, ?) ON CONFLICT(id) DO UPDATE SET value = excluded.value");
  stmt.run(id, value);
  return stmt.lastInsertRowid;
});

// Get API Dofus datas
ipcMain.handle("fetch-dofus-data", async (event, endpoint) => {
  try {
    const response = await axios.get(`https://api.dofusdu.de/dofus3/v1/${endpoint}`);
    return response.data;
  } catch (error) {
    console.error("Erreur lors de l'appel API :", error);
    return { error: "Impossible de récupérer les données." };
  }
});