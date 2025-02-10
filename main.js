const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const db = require("./db/database");

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

  win.loadURL('http://localhost:5173');
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

  // Ajouter un joueur depuis React
ipcMain.handle("add-player", async (event, playerName) => {
  const stmt = db.prepare("INSERT INTO players (name, level) VALUES (?, ?)");
  stmt.run(playerName, 1);
  return { success: true };
});

// Récupérer tous les joueurs
ipcMain.handle("get-players", async () => {
  const stmt = db.prepare("SELECT * FROM players");
  return stmt.all();
});
