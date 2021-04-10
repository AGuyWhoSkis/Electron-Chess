const { app, BrowserWindow } = require('electron')
const path = require('path')
const pug = require('pug')

function createWindow () {
    const win = new BrowserWindow({
        width:          1200,
        height:         1016,
        maxWidth:       1200,
        maxHeight:      1016,
        webPreferences: {
            preload:          path.join(__dirname, 'preload.js'),
            nodeIntegration:  true,
            contextIsolation: false
        }
    })

    win.setResizable(false)

    pug.renderFile('index.pug')
    win.loadFile('index.html')

}

app.whenReady().then(() => {
    createWindow()

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow()
        }
    })
})

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
    }
})
