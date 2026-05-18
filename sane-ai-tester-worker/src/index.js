const { machineIdSync } = require('node-machine-id');
const prompts = require('prompts');
const dotenv = require('dotenv');

// Load environment configurations
dotenv.config();

const socketClient = require('./network/socketClient');
const heartbeat = require('./network/heartbeat');
const Agent = require('./core/agent');
const logger = require('./utils/logger');
const config = require('./utils/config');

let agent = null;
let currentStatus = 'active'; // Default to active for autonomous execution

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
        setStatus('active');
        
        // Start Heartbeat updates
        heartbeat.start(workerData.workerId, agent);

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

    // Start Socket connection
    socketClient.connect();
}

function setStatus(status) {
    currentStatus = status;
    if (status === 'active') {
        logger.info("\n🚀 STATUS CHANGED TO: ONLINE (Listening for Tasks)");
        if (agent) agent.start(); // Initializes Playwright
    } else {
        logger.info("\n🛑 STATUS CHANGED TO: OFFLINE (Stopped listening)");
        if (agent) agent.cleanup(); // Closes Playwright
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