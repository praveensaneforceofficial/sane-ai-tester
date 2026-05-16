const winston = require('winston');
const path = require('path');
const fs = require('fs-extra');
const config = require('./config');

// Ensure log directory exists
fs.ensureDirSync(config.LOG_PATH);

const logFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.colorize(),
    winston.format.printf(({ timestamp, level, message }) => {
        return `${timestamp} [${level}]: ${message}`;
    })
);

const logger = winston.createLogger({
    level: config.LOG_LEVEL || 'info',
    format: logFormat,
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({
            filename: path.join(config.LOG_PATH, 'worker.log'),
            maxsize: 10485760, // 10MB
            maxFiles: 5
        }),
        new winston.transports.File({
            filename: path.join(config.LOG_PATH, 'error.log'),
            level: 'error',
            maxsize: 10485760,
            maxFiles: 5
        })
    ]
});

module.exports = logger;