const fs = require('fs-extra');
const path = require('path');

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function formatDuration(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
}

function generateId(prefix = 'task') {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
}

async function ensureDir(dirPath) {
    await fs.ensureDir(dirPath);
}

function cleanFilename(filename) {
    return filename.replace(/[^a-z0-9]/gi, '_').toLowerCase();
}

module.exports = {
    sleep,
    formatDuration,
    generateId,
    ensureDir,
    cleanFilename
};