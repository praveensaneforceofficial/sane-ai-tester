const io = require('socket.io-client');
const { machineIdSync } = require('node-machine-id');
const prompts = require('prompts');
const os = require('os');
const dotenv = require('dotenv');

// Load config
dotenv.config();

const Agent = require('./core/agent');
const logger = require('./utils/logger');
const config = require('./utils/config');

const API_URL = config.API_URL;
const socket = io(API_URL, { timeout: 5000, reconnection: true });
const mId = machineIdSync();

let currentWorkerData = null;
let agent = null;
let currentStatus = 'active'; // Default to active for autonomous execution
let heartbeatInterval = null;

async function startWorker() {
    console.clear();
    console.log("=========================================");
    console.log("     SANE-AI WORKER AGENT v3.0          ");
    console.log("     Interactive AI Test Executor       ");
    console.log("=========================================\n");

    socket.on('connect', () => {
        logger.info("✅ Server Connection: ESTABLISHED");
        // Always try to register/identify on connection
        registerWorker(config.WORKER_NAME || `System-${mId.substring(0, 4)}`);
    });

    socket.on('worker:registered', async (workerData) => {
        currentWorkerData = workerData;
        logger.info(`\n✅ Registered Successfully!`);
        logger.info(`🆔 Worker ID: ${workerData.workerId}`);
        logger.info(`👤 Nickname: ${workerData.nickname}`);
        
        // Setup Agent
        if (!agent) {
            agent = new Agent(workerData.workerId, socket, { enableRecording: config.RECORD_VIDEO });
        }
        
        // Automatically transition to active/online
        setStatus('active');
        
        // Start Heartbeat
        if (heartbeatInterval) clearInterval(heartbeatInterval);
        heartbeatInterval = setInterval(() => {
            if (socket.connected && currentStatus === 'active') {
                socket.emit('worker:heartbeat', { 
                    workerId: currentWorkerData.workerId,
                    cpu_usage: 0,
                    memory_usage: 0,
                    current_task_id: agent?.currentTask?.taskId || null
                });
            }
        }, 30000);

        // Enter Interactive Loop
        showInteractiveMenu();
    });

    // Listen to Task Assignment
    socket.on('task:assign', async (task) => {
        if (currentStatus !== 'active') {
            logger.warn(`📥 Received task ${task.taskId} but worker is OFFLINE. Ignoring.`);
            return;
        }
        
        console.log("\n=========================================");
        logger.info(`📥 NEW TASK ASSIGNED: ${task.taskId || task.id}`);
        logger.info(`🔗 URL: ${task.url}`);
        console.log("=========================================\n");
        
        if (agent) {
            await agent.executeTask(task);
        } else {
            logger.error("Agent not initialized");
        }
    });

    socket.on('connect_error', () => {
        logger.error("❌ Server Offline or Unreachable. Retrying...");
    });
}

function registerWorker(nickname) {
    socket.emit('worker:register', {
        machineId: mId,
        nickname: nickname,
        ip: config.getLocalIp(),
        os: os.platform()
    });
}

function setStatus(status) {
    currentStatus = status;
    if (status === 'active') {
        logger.info("\n🚀 STATUS CHANGED TO: ONLINE (Listening for Tasks)");
        if (agent) agent.start(); // Initializes Puppeteer
    } else {
        logger.info("\n🛑 STATUS CHANGED TO: OFFLINE (Stopped listening)");
        if (agent) agent.cleanup(); // Closes Puppeteer
    }
    
    // Server expects action as 'active' or 'offline'
    if (currentWorkerData) {
        socket.emit('worker:status', { 
            workerId: currentWorkerData.workerId, 
            action: status 
        });
    }
}

async function showInteractiveMenu() {
    // Small delay to ensure logs flush before prompt
    await new Promise(r => setTimeout(r, 500));
    
    while (true) {
        console.log(`\n--- CURRENT STATE ---`);
        console.log(`👤 Nickname: ${currentWorkerData ? currentWorkerData.nickname : 'Unknown'}`);
        console.log(`🚥 Status:   ${currentStatus.toUpperCase()}`);
        console.log(`---------------------\n`);
        
        const response = await prompts({
            type: 'select',
            name: 'action',
            message: 'Select an option:',
            choices: [
                { title: '✏️  Change Nickname', value: 'nickname' },
                { title: currentStatus === 'offline' ? '🟢 Go Online' : '🔴 Go Offline', value: 'status' },
                { title: '❌ Exit Agent', value: 'exit' }
            ]
        });

        if (!response.action) break; // Ctrl+C handling

        if (response.action === 'nickname') {
            const nickResponse = await prompts({
                type: 'text',
                name: 'newNickname',
                message: 'Enter new nickname:'
            });
            if (nickResponse.newNickname && nickResponse.newNickname.trim() !== '') {
                logger.info(`Updating nickname to: ${nickResponse.newNickname}`);
                config.WORKER_NAME = nickResponse.newNickname;
                registerWorker(nickResponse.newNickname);
                // The loop will pause here because registerWorker triggers 'worker:registered' 
                // which calls showInteractiveMenu again. So we break this loop.
                break; 
            }
        } 
        else if (response.action === 'status') {
            const newStatus = currentStatus === 'offline' ? 'active' : 'offline';
            setStatus(newStatus);
        } 
        else if (response.action === 'exit') {
            logger.info("Exiting application...");
            if (agent) await agent.cleanup();
            if (socket) socket.disconnect();
            process.exit(0);
        }
    }
}

// Graceful shutdown
process.on('SIGINT', async () => {
    logger.info('\n🛑 Shutting down worker...');
    if (currentWorkerData && socket) {
        socket.emit('worker:status', { 
            workerId: currentWorkerData.workerId, 
            action: 'offline' 
        });
        await new Promise(resolve => setTimeout(resolve, 500));
    }
    if (agent) await agent.cleanup();
    if (socket) socket.disconnect();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    if (agent) await agent.cleanup();
    process.exit(0);
});

startWorker();