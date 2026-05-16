const workerService = require('../services/workerService');
const taskService = require('../services/taskService');

class SocketManager {
    constructor(io) {
        this.io = io;
    }

    initialize() {
        this.io.on('connection', (socket) => {
            console.log('🟢 New Socket Connection:', socket.id);
            this.setupEventHandlers(socket);
        });

        // Set up periodic dashboard updates or other server-side triggers if needed
    }

    setupEventHandlers(socket) {
        // 1. Worker Registration
        socket.on('worker:register', async (data) => {
            const { machineId, nickname, ip, os } = data;
            console.log(`🔍 Registering worker: ${nickname} (${machineId})`);
            try {
                const result = await workerService.registerWorker({ machineId, nickname, ip, os });
                socket.join(result.workerId);
                socket.emit('worker:registered', result);
                this.emitDashboardUpdate();
                this.io.emit('worker:online', { workerId: result.workerId, nickname: result.nickname });
            } catch (err) {
                console.error('❌ Registration error:', err);
                socket.emit('error', { message: err.message });
            }
        });

        // 2. Worker Heartbeat
        socket.on('worker:heartbeat', async (data) => {
            const { workerId, cpu_usage, memory_usage, current_task_id } = data;
            if (workerId) {
                try {
                    await workerService.updateActivity(workerId);
                    // Optionally log heartbeat metrics here if a heartbeatService exists
                } catch (err) {
                    // Silent fail
                }
            }
        });

        // 3. Worker Status Update
        socket.on('worker:status', async (data) => {
            const { workerId, action } = data;
            try {
                const result = await workerService.updateWorkerStatus(workerId, action);
                this.emitDashboardUpdate();
                if (action === 'offline') {
                    this.io.emit('worker:offline', { workerId });
                }
            } catch (err) {
                socket.emit('error', { message: err.message });
            }
        });

        // 4. Task Completion
        socket.on('worker:task:complete', async (data) => {
            const { taskId, workerId, resultData } = data;
            try {
                await taskService.updateStatus(taskId, 'completed');
                this.emitDashboardUpdate();
                this.io.emit('report:generated', { taskId, workerId });
            } catch (err) {
                console.error('❌ Task complete error:', err);
            }
        });

        // 5. Task Error
        socket.on('worker:task:error', async (data) => {
            const { taskId, workerId, error } = data;
            try {
                await taskService.updateStatus(taskId, 'failed', error);
                this.emitDashboardUpdate();
            } catch (err) {
                console.error('❌ Task error handling error:', err);
            }
        });

        // 6. Disconnect
        socket.on('disconnect', () => {
            console.log('🔴 User disconnected:', socket.id);
        });
    }

    // Helper Emitters
    emitTaskAssign(workerId, taskData) {
        this.io.to(workerId).emit('task:assign', taskData);
    }

    emitTaskCancel(workerId, taskId) {
        this.io.to(workerId).emit('task:cancel', { taskId });
    }

    emitDashboardUpdate() {
        this.io.emit('dashboard:update');
    }

    emitTicketUpdate(ticketId, status) {
        this.io.emit('ticket:update', { ticketId, status });
    }
}

module.exports = SocketManager;