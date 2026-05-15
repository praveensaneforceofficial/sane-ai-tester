const io = require('socket.io-client');
const { machineIdSync } = require('node-machine-id');
const prompts = require('prompts');
const os = require('os');

// --- CONFIGURATION ---
const API_URL = 'http://localhost:3000'; // Change to your server IP later
const socket = io(API_URL, { timeout: 5000, reconnection: true });
const mId = machineIdSync();

async function startWorker() {
    console.clear();
    console.log("=========================================");
    console.log("     SANE-AI TESTER CONSOLE v1.0         ");
    console.log("=========================================");

    socket.on('connect', () => {
        console.log("✅ Server Connection: STABLE");
        socket.emit('check-registration', { machineId: mId });
    });

    socket.on('registration-status', async (data) => {
        if (data.exists) {
            console.log(`\nIDENTIFIED: ${data.worker.nickname} [${data.worker.worker_id}]`);
            initAgent(data.worker.worker_id);
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
                    ip: '127.0.0.1',
                    os: os.platform()
                });
            }
        }
    });

    socket.on('registered-successfully', (worker) => {
        console.log(`\n✅ Registered as: ${worker.nickname}`);
        initAgent(worker.worker_id);
    });

    // Handle incoming tasks - Just Print in Console
    socket.on('execute-task', (task) => {
        console.log("\n-----------------------------------------");
        console.log("📥 NEW TASK RECEIVED FROM BRAIN");
        console.log(`🔗 URL: ${task.url}`);
        console.log(`💬 PROMPT: ${task.prompt}`);
        console.log("-----------------------------------------");
        
        // Simulating work
        console.log("System: Processing logic... (Browser disabled for now)");
        
        // Sending back a dummy success so Brain knows we are alive
        socket.emit('task-finished', {
            taskId: task.taskId,
            workerId: task.workerId,
            status: 'completed',
            screenshot: null // No screenshot for now
        });
    });
}

function initAgent(workerId) {
    console.log(`\n🚀 STATUS: ONLINE`);
    console.log(`📡 Listening for Brain commands...`);
    
    // Tell API we are active to show in Brain Dashboard
    socket.emit('update-worker-status', { workerId: workerId, action: 'active' });

    // Keep process alive
    setInterval(() => {}, 1000); 
}

socket.on('connect_error', () => {
    console.log("❌ Server Offline. Retrying...");
});

startWorker();