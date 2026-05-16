const os = require('os');
const path = require('path');

// Load environment variables
require('dotenv').config();

const config = {
    // API Configuration
    API_URL: process.env.API_URL || 'http://localhost:3000',
    API_WS_URL: process.env.API_WS_URL || 'ws://localhost:3000',
    
    // Worker Configuration
    WORKER_NAME: process.env.WORKER_NAME || 'worker',
    WORKER_TYPE: process.env.WORKER_TYPE || 'web_local',
    RECORD_VIDEO: process.env.RECORD_VIDEO === 'true',
    SAVE_SCREENSHOTS: process.env.SAVE_SCREENSHOTS !== 'false',
    MAX_CONCURRENT_TASKS: parseInt(process.env.MAX_CONCURRENT_TASKS) || 1,
    
    // Paths
    RECORDING_PATH: process.env.RECORDING_PATH || './recordings',
    SCREENSHOT_PATH: process.env.SCREENSHOT_PATH || './recordings/screenshots',
    VIDEO_PATH: process.env.VIDEO_PATH || './recordings/videos',
    LOG_PATH: process.env.LOG_PATH || './recordings/logs',
    
    // Browser Settings
    BROWSER_HEADLESS: process.env.BROWSER_HEADLESS === 'true',
    BROWSER_SLOW_MO: parseInt(process.env.BROWSER_SLOW_MO) || 100,
    DEFAULT_TIMEOUT: parseInt(process.env.DEFAULT_TIMEOUT) || 30000,
    
    // AI Configuration
    AI_MODE: process.env.AI_MODE || 'local',
    OLLAMA_URL: process.env.OLLAMA_URL || 'http://localhost:11434',
    OLLAMA_MODEL: process.env.OLLAMA_MODEL || 'llama3',
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    OPENAI_MODEL: process.env.OPENAI_MODEL || 'gpt-4-turbo-preview',
    
    // Logging
    LOG_LEVEL: process.env.LOG_LEVEL || 'info',
    
    // Helper function to get local IP
    getLocalIp: () => {
        const interfaces = os.networkInterfaces();
        for (const name of Object.keys(interfaces)) {
            for (const iface of interfaces[name]) {
                if (iface.family === 'IPv4' && !iface.internal) {
                    return iface.address;
                }
            }
        }
        return '127.0.0.1';
    }
};

module.exports = config;