const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { Pool } = require('pg');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { 
    cors: { 
        origin: "*",
        methods: ["GET", "POST"]
    } 
});

app.use(cors());
app.use(express.json());

// Database Connection
const pool = new Pool({
    connectionString: "postgres://postgres:Iniyal@14@94.249.213.61:5432/aiDev"
});

// Test database connection
pool.connect((err, client, release) => {
    if (err) {
        console.error('❌ Database connection error:', err.stack);
    } else {
        console.log('✅ Database connected successfully');
        release();
    }
});

// --- AUTO-OFFLINE FUNCTION ---
// Function to automatically mark workers offline if they haven't been seen in 60 seconds
async function autoOfflineWorkers() {
    try {
        const result = await pool.query(`
            UPDATE worker_registry 
            SET status = 'offline' 
            WHERE status = 'online' 
            AND last_seen < NOW() - INTERVAL '60 seconds'
            RETURNING worker_id, nickname
        `);
        
        if (result.rows.length > 0) {
            console.log(`🔄 Auto-offline: ${result.rows.map(r => `${r.nickname} (${r.worker_id})`).join(', ')}`);
            // Notify brain dashboard to refresh
            io.emit('update-brain');
        }
    } catch (err) {
        console.error('❌ Auto-offline error:', err);
    }
}

// Run auto-offline check every 10 seconds
setInterval(autoOfflineWorkers, 10000);
// Initial run
autoOfflineWorkers();

// --- REST ENDPOINTS (For Brain Dashboard) ---

// 1. Fetch all workers list from DB
app.get('/api/workers', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM worker_registry ORDER BY id ASC');
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching workers:', err);
        res.status(500).json({ error: err.message });
    }
});

// 2. Fetch specific task status/history
app.get('/api/tasks/:workerId', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM tasks WHERE worker_id = $1 ORDER BY created_at DESC', [req.params.workerId]);
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching tasks:', err);
        res.status(500).json({ error: err.message });
    }
});

// 3. Get single worker details
app.get('/api/worker/:workerId', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM worker_registry WHERE worker_id = $1', [req.params.workerId]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Worker not found' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error fetching worker:', err);
        res.status(500).json({ error: err.message });
    }
});

// 4. Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// 5. Manual refresh endpoint (force status update)
app.post('/api/refresh-status', async (req, res) => {
    try {
        await autoOfflineWorkers();
        res.json({ success: true, message: 'Status refreshed' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- WebSocket Logic ---

io.on('connection', (socket) => {
    console.log('🟢 New Socket Connection:', socket.id);

    // 1. Worker Identification & Registration Flow
    socket.on('check-registration', async (data) => {
        const { machineId } = data;
        console.log(`🔍 Checking registration for machine: ${machineId}`);
        try {
            const res = await pool.query('SELECT * FROM worker_registry WHERE machine_id = $1', [machineId]);
            
            if (res.rows.length > 0) {
                // Already installed system
                console.log(`✅ Found existing worker: ${res.rows[0].worker_id}`);
                socket.emit('registration-status', { 
                    exists: true, 
                    worker: res.rows[0] 
                });
            } else {
                // New system
                console.log(`🆕 New machine requesting registration`);
                socket.emit('registration-status', { exists: false });
            }
        } catch (err) {
            console.error('❌ Registration check error:', err);
            socket.emit('registration-error', { error: err.message });
        }
    });

    // Finalize Registration with Nickname
    socket.on('register-new-worker', async (info) => {
        try {
            const { machineId, nickname, ip, os } = info;
            console.log(`📝 Registering new worker: ${nickname} (${machineId})`);
            
            // Check if machine already exists (avoid duplicates)
            const existing = await pool.query('SELECT * FROM worker_registry WHERE machine_id = $1', [machineId]);
            if (existing.rows.length > 0) {
                console.log(`⚠️ Machine already registered, reusing existing record`);
                // Update last_seen and status
                await pool.query(
                    'UPDATE worker_registry SET status = $1, last_seen = NOW() WHERE machine_id = $2',
                    ['online', machineId]
                );
                socket.emit('registered-successfully', { 
                    worker_id: existing.rows[0].worker_id, 
                    nickname: existing.rows[0].nickname 
                });
                socket.join(existing.rows[0].worker_id);
                io.emit('update-brain');
                return;
            }
            
            // Generate Unique ID
            const countRes = await pool.query('SELECT COUNT(*) FROM worker_registry');
            const count = parseInt(countRes.rows[0].count) + 1;
            const uniqueId = `sane-tester-${count.toString().padStart(3, '0')}`;

            // Insert into DB with status 'online' and last_seen
            await pool.query(
                `INSERT INTO worker_registry 
                 (worker_id, nickname, machine_id, system_ip, os_platform, status, last_seen, created_at) 
                 VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())`,
                [uniqueId, nickname, machineId, ip, os, 'online']
            );

            console.log(`✅ New Worker Registered: ${nickname} (${uniqueId})`);
            
            // Join Socket Room
            socket.join(uniqueId);
            
            // Refresh the Brain Dashboard
            io.emit('update-brain');
            
            // Tell the worker they are ready
            socket.emit('registered-successfully', { worker_id: uniqueId, nickname: nickname });

        } catch (err) {
            console.error("❌ Registration Error:", err.message);
            socket.emit('registration-error', { error: err.message });
        }
    });

    // 2. Worker Action: Deactivate / Remove / Status Update
    socket.on('update-worker-status', async (data) => {
        const { workerId, action } = data;
        
        console.log(`📡 Status update received: ${workerId} -> ${action}`);
        
        try {
            if (action === 'remove') {
                await pool.query('DELETE FROM worker_registry WHERE worker_id = $1', [workerId]);
                console.log(`🗑️ Worker ${workerId} deleted from DB.`);
                io.emit('update-brain');
                socket.emit('worker-removed', { success: true, workerId });
            } else if (action === 'active') {
                // Set worker to ONLINE and update last_seen
                await pool.query(
                    'UPDATE worker_registry SET status = $1, last_seen = NOW() WHERE worker_id = $2', 
                    ['online', workerId]
                );
                console.log(`✅ Worker ${workerId} is now ONLINE`);
                socket.join(workerId);
                io.emit('update-brain');
                socket.emit('status-updated', { workerId, status: 'online' });
            } else if (action === 'offline') {
                // Set worker to OFFLINE
                await pool.query(
                    'UPDATE worker_registry SET status = $1 WHERE worker_id = $2', 
                    ['offline', workerId]
                );
                console.log(`⚠️ Worker ${workerId} is now OFFLINE`);
                io.emit('update-brain');
                socket.emit('status-updated', { workerId, status: 'offline' });
            }
        } catch (err) {
            console.error('❌ Error updating worker status:', err);
            socket.emit('error', { message: 'Failed to update worker status' });
        }
    });

    // 3. Simple Worker Activity (Just updates last_seen)
    socket.on('worker-activity', async (data) => {
        const { workerId } = data;
        if (workerId) {
            try {
                const result = await pool.query(
                    'UPDATE worker_registry SET last_seen = NOW(), status = $1 WHERE worker_id = $2 RETURNING worker_id',
                    ['online', workerId]
                );
                if (result.rows.length > 0) {
                    // Only log occasionally to avoid spam
                    // console.log(`💓 Activity received from ${workerId}`);
                }
            } catch (err) {
                console.error('Activity update error:', err);
            }
        }
    });

    // 4. Worker Heartbeat (Legacy - kept for compatibility)
    socket.on('worker-heartbeat', async (data) => {
        const { workerId } = data;
        if (workerId) {
            try {
                await pool.query(
                    'UPDATE worker_registry SET last_seen = NOW(), status = $1 WHERE worker_id = $2', 
                    ['online', workerId]
                );
                socket.emit('heartbeat-ack', { workerId, timestamp: new Date() });
            } catch (err) {
                console.error('Heartbeat update error:', err);
            }
        }
    });

    // 5. Task Management (Brain -> API -> Worker)
    socket.on('send-task-to-worker', async (taskData) => {
        const { workerId, prompt, url } = taskData;
        console.log(`📤 Sending task to worker ${workerId}: ${url || prompt}`);
        
        try {
            // Check if worker exists and is online
            const workerCheck = await pool.query(
                'SELECT status, last_seen FROM worker_registry WHERE worker_id = $1', 
                [workerId]
            );
            
            if (workerCheck.rows.length === 0) {
                socket.emit('task-error', { error: 'Worker not found' });
                return;
            }
            
            // Check if worker is online (status = online AND last_seen within 60 seconds)
            const isOnline = workerCheck.rows[0].status === 'online';
            const lastSeen = workerCheck.rows[0].last_seen;
            const isRecent = lastSeen && (new Date() - new Date(lastSeen)) < 60000;
            
            if (!isOnline || !isRecent) {
                socket.emit('task-error', { error: 'Worker is offline or not responding' });
                return;
            }
            
            // Store task in DB
            const taskRes = await pool.query(
                'INSERT INTO tasks (worker_id, prompt, status, created_at) VALUES ($1, $2, $3, NOW()) RETURNING id',
                [workerId, prompt || url, 'pending']
            );
            const taskId = taskRes.rows[0].id;

            // Forward to specific worker via Room
            io.to(workerId).emit('execute-task', {
                taskId: taskId,
                url: url,
                prompt: prompt,
                workerId: workerId
            });
            
            console.log(`✅ Task ${taskId} forwarded to ${workerId}`);
            socket.emit('task-sent', { taskId, workerId, status: 'pending' });
            
        } catch (err) {
            console.error('❌ Error sending task:', err);
            socket.emit('task-error', { error: err.message });
        }
    });

    // 6. Result Handling (Worker -> API -> Brain)
    socket.on('task-finished', async (result) => {
        const { taskId, workerId, status, screenshot, error, data } = result;
        console.log(`📥 Task completed: ${taskId} by ${workerId} with status: ${status}`);
        
        try {
            // Update DB with result
            const resultData = { screenshot, error, data };
            await pool.query(
                'UPDATE tasks SET status = $1, result_data = $2, completed_at = NOW() WHERE id = $3',
                [status, JSON.stringify(resultData), taskId]
            );

            // Update worker last_seen
            await pool.query(
                'UPDATE worker_registry SET last_seen = NOW() WHERE worker_id = $1', 
                [workerId]
            );

            // Inform Brain Dashboard
            io.emit('task-completed-alert', { workerId, status, taskId, data: resultData });
            
            console.log(`✅ Task ${taskId} results saved to database`);
            
        } catch (err) {
            console.error('❌ Error saving task result:', err);
        }
    });

    // 7. Get task history for a worker
    socket.on('get-task-history', async (data) => {
        const { workerId, limit = 10 } = data;
        try {
            const result = await pool.query(
                'SELECT * FROM tasks WHERE worker_id = $1 ORDER BY created_at DESC LIMIT $2',
                [workerId, limit]
            );
            socket.emit('task-history', { workerId, tasks: result.rows });
        } catch (err) {
            console.error('Error fetching task history:', err);
            socket.emit('error', { message: 'Failed to fetch task history' });
        }
    });

    // 8. Handle disconnection
    socket.on('disconnect', () => {
        console.log('🔴 User disconnected:', socket.id);
    });
});

// Error handling for the server
server.on('error', (error) => {
    console.error('❌ Server error:', error);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing HTTP server');
    server.close(() => {
        console.log('HTTP server closed');
        pool.end(() => {
            console.log('Database pool closed');
            process.exit(0);
        });
    });
});

process.on('SIGINT', () => {
    console.log('SIGINT signal received: closing HTTP server');
    server.close(() => {
        console.log('HTTP server closed');
        pool.end(() => {
            console.log('Database pool closed');
            process.exit(0);
        });
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`
╔═══════════════════════════════════════════════════════════════╗
║     🧠 SANE-AI CENTRAL API SERVER                            ║
║     🚀 Running on port: ${PORT}                                 ║
║     📡 WebSocket: ws://localhost:${PORT}                       ║
║     🔗 REST API: http://localhost:${PORT}/api                  ║
║     ⏰ Auto-offline: 60 seconds timeout                        ║
╚═══════════════════════════════════════════════════════════════╝
    `);
});