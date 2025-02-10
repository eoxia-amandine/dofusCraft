const Database = require("better-sqlite3");
const path = require("path");

// Définir le chemin de la base de données
const dbPath = path.join(__dirname, "dofusCraft.db");

// Ouvrir la base de données
const db = new Database(dbPath, { verbose: console.log });

// Créer une table si elle n'existe pas
db.prepare(`
  CREATE TABLE IF NOT EXISTS players (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    level INTEGER
  )
`).run();

console.log("Base de données initialisée !");

// Exporter l'objet db pour y accéder depuis Electron
module.exports = db;
