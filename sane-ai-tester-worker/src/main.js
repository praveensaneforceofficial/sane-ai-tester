const { app, BrowserWindow, Tray, Menu, ipcMain } = require('electron');
const path = require('path');
const { machineIdSync } = require('node-machine-id');
const io = require('socket.io-client');
const dotenv = require('dotenv');
const path = require('path');

// In packaged Electron apps, process.cwd() is NOT the app directory.
// Resolve .env relative to this file's location (src/) -> parent is project root.
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

let mainWindow;
let tray = null;
let socket = null;
let workerId = null;

const API_URL = process.env.API_URL || 'http://localhost:3000';

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 500,
        height: 400,
        title: "Sane-AI Tester Worker",
        icon: path.join(__dirname, '../icon.png'),
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js')
        },
        show: false
    });

    // Create HTML content
    const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Sane-AI Worker</title>
            <style>
                body {
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    margin: 0;
                    padding: 20px;
                    color: white;
                }
                .container {
                    text-align: center;
                    padding: 40px;
                }
                .status {
                    font-size: 24px;
                    margin: 20px 0;
                }
                .online { color: #4ade80; }
                .offline { color: #f87171; }
                .busy { color: #fbbf24; }
                .worker-id {
                    background: rgba(255,255,255,0.2);
                    padding: 10px;
                    border-radius: 8px;
                    font-family: monospace;
                    margin: 20px 0;
                }
                .task-status {
                    background: rgba(0,0,0,0.3);
                    padding: 15px;
                    border-radius: 8px;
                    margin-top: 20px;
                    font-size: 14px;
                }
                button {
                    background: white;
                    color: #4f46e5;
                    border: none;
                    padding: 10px 20px;
                    border-radius: 8px;
                    cursor: pointer;
                    font-weight: bold;
                    margin-top: 20px;
                }
                button:hover {
                    transform: scale(1.05);
                }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>🧠 Sane-AI Tester Worker</h1>
                <div class="status" id="status">🟡 Connecting...</div>
                <div class="worker-id" id="workerId">Initializing...</div>
                <div class="task-status" id="taskStatus">No active task</div>
                <button onclick="showWindow()">Show Details</button>
            </div>
            <script>
                window.showWindow = () => {
                    window.open('', '_blank');
                };
            </script>
        </body>
        </html>
    `;

    mainWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);
    
    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
    });

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

function createTray() {
    tray = new Tray(path.join(__dirname, '../icon.png'));
    const contextMenu = Menu.buildFromTemplate([
        { label: 'Show', click: () => mainWindow?.show() },
        { label: 'Hide', click: () => mainWindow?.hide() },
        { type: 'separator' },
        { label: 'Exit', click: () => app.quit() }
    ]);
    tray.setToolTip('Sane-AI Tester Worker');
    tray.setContextMenu(contextMenu);
    
    tray.on('click', () => {
        mainWindow?.isVisible() ? mainWindow.hide() : mainWindow?.show();
    });
}

function connectToServer() {
    socket = io(API_URL, { timeout: 5000, reconnection: true });
    
    socket.on('connect', () => {
        updateStatus('online', 'Connected');
        const machineId = machineIdSync();
        socket.emit('check-registration', { machineId });
    });
    
    socket.on('disconnect', () => {
        updateStatus('offline', 'Disconnected');
    });
    
    socket.on('registration-status', (data) => {
        if (data.exists) {
            workerId = data.worker.worker_id;
            updateWorkerId(data.worker.nickname, workerId);
            socket.emit('update-worker-status', { workerId, action: 'active' });
        }
    });
    
    socket.on('registered-successfully', (worker) => {
        workerId = worker.worker_id;
        updateWorkerId(worker.nickname, workerId);
    });
    
    socket.on('execute-task', (task) => {
        updateTaskStatus(`Running: ${task.url}`);
        // Task execution handled by main process
        ipcMain.emit('execute-task', task);
    });
}

function updateStatus(status, message) {
    if (mainWindow) {
        mainWindow.webContents.executeJavaScript(`
            const el = document.getElementById('status');
            el.className = 'status ${status}';
            el.innerHTML = '${status === 'online' ? '🟢' : status === 'offline' ? '🔴' : '🟡'} ${message}';
        `);
    }
}

function updateWorkerId(nickname, id) {
    if (mainWindow) {
        mainWindow.webContents.executeJavaScript(`
            document.getElementById('workerId').innerHTML = '${nickname}<br><small>${id}</small>';
        `);
    }
}

function updateTaskStatus(message) {
    if (mainWindow) {
        mainWindow.webContents.executeJavaScript(`
            document.getElementById('taskStatus').innerHTML = '📋 ${message}';
        `);
    }
}

const axios = require('axios');

async function checkBrainAndConnect() {
    if (mainWindow) {
        mainWindow.webContents.executeJavaScript(`
            document.getElementById('status').className = 'status offline';
            document.getElementById('status').innerHTML = '🟡 Waiting for Brain AI...';
        `);
    }
    while (true) {
        try {
            const response = await axios.get(`${API_URL}/api/brain/status`, { timeout: 3000 });
            if (response.data && response.data.connected) {
                if (mainWindow) {
                    mainWindow.webContents.executeJavaScript(`
                        document.getElementById('status').className = 'status online';
                        document.getElementById('status').innerHTML = '🟢 Connecting...';
                    `);
                }
                connectToServer();
                break;
            }
        } catch (err) {
            // ignore error
        }
        await new Promise(resolve => setTimeout(resolve, 5000));
    }
}

app.whenReady().then(() => {
    createWindow();
    createTray();
    checkBrainAndConnect();
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});