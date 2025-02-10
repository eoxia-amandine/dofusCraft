const { app, BrowserWindow } = require('electron');
const path = require("path");

const createWindow = () => {
  const win = new BrowserWindow({
    width: 1280,
    height: 720
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
