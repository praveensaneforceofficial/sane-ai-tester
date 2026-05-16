const io = require('socket.io-client');
const { machineIdSync } = require('node-machine-id');
const prompts = require('prompts');
const os = require('os');
const dotenv = require('dotenv');
const path = require('path');

// Load config
dotenv.config();

const Agent = require('./core/agent');
const logger = require('./utils/logger');
const config = require('./utils/config');

const API_URL = config.API_URL;
const socket = io(API_URL, { timeout: 5000, reconnection: true });
const mId = machineIdSync();

let currentWorkerId = null;
let agent = null;

async function startWorker() {
    console.clear();
    console.log("=========================================");
    console.log("     SANE-AI TESTER WORKER v2.0         ");
    console.log("     AI-Powered Test Execution          ");
    console.log("=========================================\n");

    socket.on('connect', () => {
        logger.info("✅ Server Connection: STABLE");
        socket.emit('check-registration', { machineId: mId });
    });

    socket.on('registration-status', async (data) => {
        if (data.exists) {
            logger.info(`\nIDENTIFIED: ${data.worker.nickname} [${data.worker.worker_id}]`);
            
            const choice = await prompts({
                type: 'select',
                name: 'action',
                message: 'Select Action:',
                choices: [
                    { title: '🚀 Start Agent (Online)', value: 'connect' },
                    { title: '📹 Start with Recording', value: 'record' },
                    { title: '🗑️ Remove/Uninstall System', value: 'remove' },
                    { title: '❌ Exit', value: 'exit' }
                ]
            });

            if (choice.action === 'connect') {
                initAgent(data.worker.worker_id, false);
            } else if (choice.action === 'record') {
                initAgent(data.worker.worker_id, true);
            } else if (choice.action === 'remove') {
                logger.info("Removing system from registry...");
                socket.emit('update-worker-status', { 
                    workerId: data.worker.worker_id, 
                    action: 'remove' 
                });
                setTimeout(() => process.exit(), 2000);
            } else {
                process.exit();
            }
        } else {
            const response = await prompts({
                type: 'text',
                name: 'nickname',
                message: 'New System! Enter Nickname to Register:'
            });
            
            if (response.nickname) {
                socket.emit('register-new-worker', {
                    machineId: mId,
                    nickname: response.nickname,
                    ip: config.getLocalIp(),
                    os: os.platform()
                });
            }
        }
    });

    socket.on('registered-successfully', (worker) => {
        logger.info(`\n✅ Registered as: ${worker.nickname}`);
        initAgent(worker.worker_id, false);
    });

    // Handle incoming tasks from Brain
    socket.on('execute-task', async (task) => {
        logger.info(`\n📥 NEW TASK RECEIVED FROM BRAIN`);
        logger.info(`🔗 URL: ${task.url}`);
        logger.info(`💬 PROMPT: ${task.prompt}`);
        logger.info(`📋 Task ID: ${task.taskId}`);
        
        if (agent) {
            await agent.executeTask(task);
        } else {
            logger.error("Agent not initialized");
            socket.emit('task-finished', {
                taskId: task.taskId,
                workerId: currentWorkerId,
                status: 'failed',
                error: 'Agent not initialized'
            });
        }
    });

    socket.on('connect_error', () => {
        logger.error("❌ Server Offline. Retrying...");
    });
}

function initAgent(workerId, enableRecording) {
    currentWorkerId = workerId;
    
    agent = new Agent(workerId, socket, { enableRecording });
    
    agent.on('status', (status) => {
        socket.emit('update-worker-status', { 
            workerId: workerId, 
            action: status === 'online' ? 'active' : 'offline' 
        });
    });
    
    agent.start();
    
    // Heartbeat every 30 seconds
    setInterval(() => {
        if (socket.connected && currentWorkerId) {
            socket.emit('worker-heartbeat', { workerId: currentWorkerId });
            socket.emit('worker-activity', { workerId: currentWorkerId });
        }
    }, 30000);
}

// Graceful shutdown
process.on('SIGINT', async () => {
    logger.info('\n🛑 Shutting down worker...');
    if (currentWorkerId && socket) {
        socket.emit('update-worker-status', { 
            workerId: currentWorkerId, 
            action: 'offline' 
        });
        await new Promise(resolve => setTimeout(resolve, 500));
    }
    if (agent) {
        await agent.cleanup();
    }
    if (socket) socket.disconnect();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    logger.info('🛑 Received SIGTERM, shutting down...');
    if (currentWorkerId && socket) {
        socket.emit('update-worker-status', { 
            workerId: currentWorkerId, 
            action: 'offline' 
        });
        await new Promise(resolve => setTimeout(resolve, 500));
    }
    if (agent) {
        await agent.cleanup();
    }
    process.exit(0);
});

startWorker();