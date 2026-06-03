const workerService = require('../services/workerService');
const taskService = require('../services/taskService');
const reportService = require('../services/reportService');
const brainBridge = require('../services/brainWebSocketBridge');

class SocketManager {
    constructor(io) {
        this.io = io;
    }

    initialize() {
        this.io.on('connection', (socket) => {
            console.log('🟢 New Socket Connection:', socket.id);
            this.setupEventHandlers(socket);
        });
    }

    setupEventHandlers(socket) {
        // Brain Registration & Communication
        socket.on('brain:register', () => {
            console.log(`🧠 Registering Brain client: ${socket.id}`);
            socket.isBrain = true;
            brainBridge.setBrainSocket(socket);
        });

        socket.on('brain:response', (data) => {
            brainBridge.handleBrainResponse(data);
        });

        // 1. Worker Registration
        socket.on('worker:register', async (data) => {
            const { machineId, nickname, ip, os } = data;
            console.log(`🔍 Registering worker: ${nickname} (${machineId})`);
            try {
                const result = await workerService.registerWorker({ machineId, nickname, ip, os });
                socket.join(result.workerId);
                socket.workerId = result.workerId;
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
                
                // Calculate success rate and test counts
                let total = resultData.actions ? resultData.actions.length : 0;
                let passed = resultData.actions ? resultData.actions.filter(a => a.success).length : 0;
                let failed = total - passed;
                let successRate = total > 0 ? (passed / total) * 100 : 0;
                
                // Fallback for Dynamic Scripts that just return status
                if (total === 0 && resultData.status) {
                    total = 1;
                    passed = resultData.status === 'completed' ? 1 : 0;
                    failed = total - passed;
                    successRate = passed * 100;
                }
                
                // Get task info for project name
                const task = await taskService.getById(taskId).catch(() => null);
                const projectName = task ? (task.project_name || 'Saneforce Project') : 'Saneforce Project';

                // Automatically generate and save test report to DB
                await reportService.generate({
                    task_id: taskId,
                    worker_id: workerId,
                    project_name: projectName,
                    total_tests: total,
                    passed_tests: passed,
                    failed_tests: failed,
                    skipped_tests: 0,
                    success_rate: successRate,
                    duration: 0,
                    summary: resultData.summary || 'AI Auto-Test execution completed.',
                    report_data: JSON.stringify(resultData),
                    video_path: resultData.videoPath || null,
                    screenshots: JSON.stringify(resultData.screenshots || [])
                });

                this.emitDashboardUpdate();
                
                // Dashboard Hook expects task-completed-alert
                this.io.emit('task-completed-alert', { taskId, workerId });
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

        // 5.5 Task Start
        socket.on('worker:task:start', async (data) => {
            const { taskId, workerId } = data;
            try {
                await taskService.updateStatus(taskId, 'in_progress');
                this.emitDashboardUpdate();
            } catch (err) {
                console.error('❌ Task start error:', err);
            }
        });

        // 6. Task Assignment Relay (Brain → API → Worker)
        socket.on('task:assign', (data) => {
            const { workerId, taskId, url, prompt } = data;
            console.log(`📤 Relaying task ${taskId} to worker ${workerId}`);
            this.io.to(workerId).emit('task:assign', { taskId, url, prompt });
            this.emitDashboardUpdate();
        });

        // 7. Disconnect
        socket.on('disconnect', async () => {
            console.log('🔴 User disconnected:', socket.id);
            if (socket.isBrain) {
                console.log(`🔌 Brain disconnected: ${socket.id}`);
                brainBridge.clearBrainSocket(socket);
            }
            if (socket.workerId) {
                console.log(`🔌 Worker disconnected: ${socket.workerId}. Marking offline...`);
                try {
                    await workerService.updateWorkerStatus(socket.workerId, 'offline');
                    this.emitDashboardUpdate();
                    this.io.emit('worker:offline', { workerId: socket.workerId });
                } catch (err) {
                    console.error(`❌ Failed to set worker ${socket.workerId} offline:`, err);
                }
            }
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
        // UI expects 'update-brain' to refresh React components
        this.io.emit('update-brain');
        this.io.emit('dashboard:update');
    }

    emitTicketUpdate(ticketId, status) {
        this.io.emit('ticket:update', { ticketId, status });
    }
}

module.exports = SocketManager;