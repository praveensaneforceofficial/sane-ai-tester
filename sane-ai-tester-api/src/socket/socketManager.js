const workerService = require('../services/workerService');
const taskService = require('../services/taskService');
const heartbeatService = require('../services/heartbeatService');

class SocketManager {
    constructor(io) {
        this.io = io;
    }

    initialize() {
        // Start heartbeat service
        heartbeatService.start((offlineWorkers) => {
            this.io.emit('update-brain');
        });

        this.io.on('connection', (socket) => {
            console.log('🟢 New Socket Connection:', socket.id);
            this.setupEventHandlers(socket);
        });
    }

    setupEventHandlers(socket) {
        // 1. Check Registration
        socket.on('check-registration', async (data) => {
            const { machineId } = data;
            console.log(`🔍 Checking registration for machine: ${machineId}`);
            try {
                const worker = await workerService.getWorkerByMachineId(machineId);
                socket.emit('registration-status', { 
                    exists: !!worker, 
                    worker: worker || null 
                });
            } catch (err) {
                console.error('❌ Registration check error:', err);
                socket.emit('registration-error', { error: err.message });
            }
        });

        // 2. Register New Worker
        socket.on('register-new-worker', async (info) => {
            try {
                const { machineId, nickname, ip, os } = info;
                console.log(`📝 Registering new worker: ${nickname} (${machineId})`);
                
                const result = await workerService.registerWorker({ machineId, nickname, ip, os });
                
                socket.emit('registered-successfully', { 
                    worker_id: result.workerId, 
                    nickname: result.nickname 
                });
                
                socket.join(result.workerId);
                this.io.emit('update-brain');
                
            } catch (err) {
                console.error("❌ Registration Error:", err.message);
                socket.emit('registration-error', { error: err.message });
            }
        });

        // 3. Update Worker Status
        socket.on('update-worker-status', async (data) => {
            const { workerId, action } = data;
            console.log(`📡 Status update received: ${workerId} -> ${action}`);
            
            try {
                const result = await workerService.updateWorkerStatus(workerId, action);
                
                if (action === 'active') {
                    socket.join(workerId);
                }
                
                this.io.emit('update-brain');
                socket.emit('status-updated', result);
                
            } catch (err) {
                console.error('❌ Error updating worker status:', err);
                socket.emit('error', { message: err.message });
            }
        });

        // 4. Worker Activity (Heartbeat)
        socket.on('worker-activity', async (data) => {
            const { workerId } = data;
            if (workerId) {
                try {
                    await workerService.updateActivity(workerId);
                } catch (err) {
                    // Silent fail - don't spam logs
                }
            }
        });

        // 5. Worker Heartbeat (Legacy)
        socket.on('worker-heartbeat', async (data) => {
            const { workerId } = data;
            if (workerId) {
                try {
                    await workerService.updateActivity(workerId);
                    socket.emit('heartbeat-ack', { workerId, timestamp: new Date() });
                } catch (err) {
                    console.error('Heartbeat update error:', err);
                }
            }
        });

        // 6. Send Task to Worker
        socket.on('send-task-to-worker', async (taskData) => {
            const { workerId, prompt, url } = taskData;
            console.log(`📤 Sending task to worker ${workerId}: ${url || prompt}`);
            
            try {
                // Check if worker is online
                await workerService.getWorkerForTask(workerId);
                
                // Create task
                const task = await taskService.createTask(workerId, { prompt, url });
                
                // Forward to worker
                this.io.to(workerId).emit('execute-task', {
                    taskId: task.id,
                    url: url,
                    prompt: prompt,
                    workerId: workerId
                });
                
                console.log(`✅ Task ${task.id} forwarded to ${workerId}`);
                socket.emit('task-sent', { taskId: task.id, workerId, status: 'pending' });
                
            } catch (err) {
                console.error('❌ Error sending task:', err);
                socket.emit('task-error', { error: err.message });
            }
        });

        // 7. Task Finished
        socket.on('task-finished', async (result) => {
            const { taskId, workerId, status, screenshot, error, data } = result;
            console.log(`📥 Task completed: ${taskId} by ${workerId} with status: ${status}`);
            
            try {
                // Update task
                const task = await taskService.completeTask(taskId, { status, screenshot, error, data });
                
                // Update worker activity
                await workerService.updateActivity(workerId);
                
                // Notify dashboard
                this.io.emit('task-completed-alert', { 
                    workerId, 
                    status, 
                    taskId, 
                    data: { screenshot, error, data } 
                });
                
                console.log(`✅ Task ${taskId} results saved to database`);
                
            } catch (err) {
                console.error('❌ Error saving task result:', err);
            }
        });

        // 8. Get Task History
        socket.on('get-task-history', async (data) => {
            const { workerId, limit = 10 } = data;
            try {
                const tasks = await taskService.getTaskHistory(workerId, limit);
                socket.emit('task-history', { workerId, tasks });
            } catch (err) {
                console.error('Error fetching task history:', err);
                socket.emit('error', { message: 'Failed to fetch task history' });
            }
        });

        // 9. Disconnect
        socket.on('disconnect', () => {
            console.log('🔴 User disconnected:', socket.id);
        });
    }
}

module.exports = SocketManager;