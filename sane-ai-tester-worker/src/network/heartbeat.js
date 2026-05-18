const logger = require('../utils/logger');
const socketClient = require('./socketClient');

class HeartbeatManager {
    constructor() {
        this.intervalId = null;
    }

    start(workerId, agentInstance) {
        this.stop();
        logger.info(`Starting heartbeat updates for worker ${workerId}...`);
        this.intervalId = setInterval(() => {
            if (socketClient.socket && socketClient.socket.connected) {
                socketClient.emit('worker:heartbeat', {
                    workerId,
                    cpu_usage: 0,
                    memory_usage: 0,
                    current_task_id: agentInstance?.currentTask?.taskId || agentInstance?.currentTask?.id || null
                });
            }
        }, 30000);
    }

    stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
            logger.info("Heartbeat updates stopped.");
        }
    }
}

module.exports = new HeartbeatManager();
