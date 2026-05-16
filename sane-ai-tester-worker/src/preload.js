const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    onExecuteTask: (callback) => ipcRenderer.on('execute-task', callback),
    sendTaskResult: (result) => ipcRenderer.send('task-result', result)
});