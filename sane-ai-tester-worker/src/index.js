const { machineIdSync } = require('node-machine-id');
const prompts = require('prompts');
const dotenv = require('dotenv');
const axios = require('axios');
const path = require('path');

// Resolve .env relative to this file's location (src/) -> parent is project root.
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const socketClient = require('./network/socketClient');
const heartbeat = require('./network/heartbeat');
const Agent = require('./core/agent');
const logger = require('./utils/logger');
const config = require('./utils/config');

let agent = null;
let currentStatus = 'active'; // Default to active for autonomous execution

async function fetchAndExecutePendingTasks(workerId) {
    logger.info(`🔍 Checking for pending tasks assigned to worker ${workerId}...`);
    try {
        const response = await axios.get(`${config.API_URL}/api/tasks/worker/${workerId}`);
        const tasks = response.data;

        // Only pick up FRESH pending tasks (created within last 2 hours)
        // This prevents old stale tasks from being re-executed on every restart
        const TWO_HOURS_MS = 2 * 60 * 60 * 1000;
        const now = Date.now();
        const pendingTasks = tasks.filter(t => {
            if (t.status !== 'pending') return false;
            const createdAt = t.created_at ? new Date(t.created_at).getTime() : 0;
            const ageMs = now - createdAt;
            if (ageMs > TWO_HOURS_MS) {
                logger.warn(`⏳ Skipping stale task ${t.task_id} (created ${Math.round(ageMs / 60000)} min ago)`);
                return false;
            }
            return true;
        });

        logger.info(`📋 Found ${pendingTasks.length} fresh pending task(s) (skipped ${tasks.filter(t => t.status === 'pending').length - pendingTasks.length} stale)`);
        
        if (pendingTasks.length > 0 && agent) {
            // Pick the first pending task
            const task = pendingTasks[0];
            logger.info(`🎯 Automatically starting pending task: ${task.task_id || task.id}`);
            
            // Format task payload
            const taskPayload = {
                taskId: task.task_id || task.id,
                url: task.url,
                prompt: task.prompt || task.test_instructions
            };
            
            // Execute task asynchronously so registration flow is not blocked
            agent.executeTask(taskPayload).catch(err => {
                logger.error(`❌ Failed to execute pending task: ${err.message}`);
            });
        }
    } catch (err) {
        logger.error(`❌ Failed to fetch pending tasks: ${err.message}`);
    }
}

async function checkBrainAndConnect() {
    logger.info("🧠 Waiting for Brain AI to be connected to the API WebSocket...");
    while (true) {
        try {
            const response = await axios.get(`${config.API_URL}/api/brain/status`, { timeout: 3000 });
            if (response.data && response.data.connected) {
                logger.info("✅ Brain AI is connected! Establishing WebSocket connection...");
                socketClient.connect();
                break;
            }
        } catch (err) {
            // ignore error
        }
        logger.info("⏳ Brain AI offline/unreachable. Retrying in 5 seconds...");
        await new Promise(resolve => setTimeout(resolve, 5000));
    }
}

async function startWorker() {
    console.clear();
    console.log("=========================================");
    console.log("     SANE-AI WORKER AGENT v3.0          ");
    console.log("     Interactive AI Test Executor       ");
    console.log("=========================================\n");

    // Configure connection events
    socketClient.on('onConnect', () => {
        logger.info("✅ Connected to Central Server");
    });

    socketClient.on('onRegistered', async (workerData) => {
        logger.info(`\n✅ Registered Successfully!`);
        logger.info(`🆔 Worker ID: ${workerData.workerId}`);
        logger.info(`👤 Nickname: ${workerData.nickname}`);
        
        // Setup Agent
        if (!agent) {
            agent = new Agent(workerData.workerId, socketClient, { enableRecording: config.RECORD_VIDEO });
        }
        
        // Automatically transition to active/online
        await setStatus('active');
        
        // Start Heartbeat updates
        heartbeat.start(workerData.workerId, agent);

        // Fetch and execute pending tasks automatically
        try {
            await fetchAndExecutePendingTasks(workerData.workerId);
        } catch (err) {
            logger.error(`Error checking pending tasks: ${err.message}`);
        }

        // Enter Interactive Loop
        showInteractiveMenu();
    });

    socketClient.on('onTaskAssign', async (task) => {
        if (currentStatus !== 'active') {
            logger.warn(`📥 Received task but worker is OFFLINE. Ignoring.`);
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

    socketClient.on('onTaskCancel', async (data) => {
        logger.info(`📥 CANCEL TASK RECEIVED for: ${data.taskId}`);
        if (agent && agent.currentTask && (agent.currentTask.taskId || agent.currentTask.id) === data.taskId) {
            logger.info(`🛑 Aborting task ${data.taskId}...`);
            await agent.cleanup();
            // Re-initialize agent/playwright runner to be ready for next task
            await agent.start();
        }
    });

    socketClient.on('onDisconnect', async (reason) => {
        logger.warn(`🔌 Disconnected from central server: ${reason}`);
        if (agent && agent.isRunning) {
            logger.info("⚠️ Disconnection detected. Aborting active browser/tasks...");
            await agent.cleanup();
        }
    });

    // Start Socket connection check and connect
    await checkBrainAndConnect();
}

async function setStatus(status) {
    currentStatus = status;
    if (status === 'active') {
        logger.info("\n🚀 STATUS CHANGED TO: ONLINE (Listening for Tasks)");
        if (agent) await agent.start(); // Initializes Playwright
    } else {
        logger.info("\n🛑 STATUS CHANGED TO: OFFLINE (Stopped listening)");
        if (agent) await agent.cleanup(); // Closes Playwright
    }
    
    if (socketClient.workerId) {
        socketClient.emit('worker:status', { 
            workerId: socketClient.workerId, 
            action: status 
        });
    }
}

async function showInteractiveMenu() {
    await new Promise(r => setTimeout(r, 500));
    
    while (true) {
        console.log(`\n--- CURRENT STATE ---`);
        console.log(`👤 Nickname: ${socketClient.nickname || 'Unknown'}`);
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

        if (!response.action) break;

        if (response.action === 'nickname') {
            const nickResponse = await prompts({
                type: 'text',
                name: 'newNickname',
                message: 'Enter new nickname:'
            });
            if (nickResponse.newNickname && nickResponse.newNickname.trim() !== '') {
                logger.info(`Updating nickname to: ${nickResponse.newNickname}`);
                config.WORKER_NAME = nickResponse.newNickname;
                socketClient.register(nickResponse.newNickname);
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
            heartbeat.stop();
            socketClient.disconnect();
            process.exit(0);
        }
    }
}

// Graceful shutdown
const shutdown = async () => {
    logger.info('\n🛑 Shutting down worker...');
    if (socketClient.workerId) {
        socketClient.emit('worker:status', { 
            workerId: socketClient.workerId, 
            action: 'offline' 
        });
        await new Promise(resolve => setTimeout(resolve, 500));
    }
    if (agent) await agent.cleanup();
    heartbeat.stop();
    socketClient.disconnect();
    process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

startWorker();