const { app, BrowserWindow, Tray, Menu } = require('electron');
const path = require('path');
const io = require('socket.io-client');
const { machineIdSync } = require('node-machine-id');

let mainWindow;
const socket = io('http://94.249.213.61:3000');

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 400,
        height: 300,
        title: "Sane-AI Tester Worker",
        icon: path.join(__dirname, 'icon.png'),
        webPreferences: { nodeIntegration: true }
    });

    // Simple UI to show status
    mainWindow.loadURL(`data:text/html,
        <body style="font-family:sans-serif; text-align:center; padding:50px;">
            <h2>Sane-AI Tester</h2>
            <p id="status">Connecting...</p>
            <p id="name">Identifying...</p>
        </body>
    `);

    socket.on('connect', () => {
        const myId = machineIdSync();
        socket.emit('register-worker', { machineId: myId });
    });

    socket.on('registered', (data) => {
        mainWindow.webContents.executeJavaScript(`
            document.getElementById('status').innerText = 'Status: Online';
            document.getElementById('status').style.color = 'green';
            document.getElementById('name').innerText = 'ID: ${data.workerName}';
        `);
    });
}

app.whenReady().then(createWindow);