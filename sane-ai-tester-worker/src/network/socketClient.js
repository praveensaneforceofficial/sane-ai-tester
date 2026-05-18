const io = require('socket.io-client');
const config = require('../utils/config');
const logger = require('../utils/logger');
const { machineIdSync } = require('node-machine-id');
const os = require('os');

class SocketClient {
    constructor() {
        this.socket = null;
        this.workerId = null;
        this.nickname = null;
        this.callbacks = {};
    }

    connect() {
        logger.info(`Connecting to socket server at ${config.API_URL}...`);
        this.socket = io(config.API_URL, { timeout: 5000, reconnection: true });
        this.mId = machineIdSync();

        this.socket.on('connect', () => {
            logger.info("✅ Socket connection established");
            this.register(config.WORKER_NAME || `System-${this.mId.substring(0, 4)}`);
            if (this.callbacks.onConnect) this.callbacks.onConnect();
        });

        this.socket.on('connect_error', (error) => {
            logger.error(`❌ Connection error: ${error.message}`);
            if (this.callbacks.onConnectError) this.callbacks.onConnectError(error);
        });

        this.socket.on('worker:registered', (data) => {
            this.workerId = data.workerId;
            this.nickname = data.nickname;
            if (this.callbacks.onRegistered) this.callbacks.onRegistered(data);
        });

        this.socket.on('task:assign', (task) => {
            if (this.callbacks.onTaskAssign) this.callbacks.onTaskAssign(task);
        });

        this.socket.on('disconnect', (reason) => {
            logger.warn(`🔌 Disconnected from socket server: ${reason}`);
            if (this.callbacks.onDisconnect) this.callbacks.onDisconnect(reason);
        });
    }

    on(event, callback) {
        this.callbacks[event] = callback;
    }

    emit(event, data) {
        if (this.socket && this.socket.connected) {
            this.socket.emit(event, data);
        } else {
            logger.warn(`⚠️ Socket not connected, could not emit event: ${event}`);
        }
    }

    register(nickname) {
        logger.info(`Sending registration request for nickname: ${nickname}`);
        this.emit('worker:register', {
            machineId: this.mId,
            nickname: nickname,
            ip: config.getLocalIp(),
            os: os.platform()
        });
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            logger.info("🔌 Socket manually disconnected");
        }
    }
}

module.exports = new SocketClient();
