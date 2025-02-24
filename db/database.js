const Database = require("better-sqlite3");
const path = require("path");

// Définir le chemin de la base de données
const dbPath = path.join(__dirname, "dofusCraft.db");

// Ouvrir la base de données
const db = new Database(dbPath, { verbose: console.log });

// Créer une table si elle n'existe pas
db.prepare(`
  CREATE TABLE IF NOT EXISTS list (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    label TEXT NOT NULL
  )
`).run();

db.prepare(`
  CREATE TABLE IF NOT EXISTS listItem (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    listId INTEGER NOT NULL,
    ankamaId INTEGER NOT NULL,
    type TEXT NOT NULL,
    FOREIGN KEY (listId) REFERENCES list(id)
  )
`).run();

db.prepare(`
  CREATE TABLE IF NOT EXISTS price (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ankamaId INTEGER NOT NULL,
    date TEXT DEFAULT (datetime('now', 'localtime')),
    value INTEGER NOT NULL
  )
`).run();


// Exporter l'objet db pour y accéder depuis Electron
module.exports = db;