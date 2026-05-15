const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { Pool } = require('pg');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(cors());
app.use(express.json());

// Database Connection
const pool = new Pool({
    connectionString: "postgres://postgres:Iniyal@14@94.249.213.61:5432/aiDev"
});

// --- REST ENDPOINTS (For Brain Dashboard) ---

// 1. Fetch all workers list from DB
app.get('/api/workers', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM worker_registry ORDER BY id ASC');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 2. Fetch specific task status/history
app.get('/api/tasks/:workerId', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM tasks WHERE worker_id = $1 ORDER BY created_at DESC', [req.params.workerId]);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- WebSocket Logic ---

io.on('connection', (socket) => {
    console.log('New Socket Connection:', socket.id);

    // 1. Worker Identification & Registration Flow
    socket.on('check-registration', async (data) => {
        const { machineId } = data;
        try {
            const res = await pool.query('SELECT * FROM worker_registry WHERE machine_id = $1', [machineId]);
            
            if (res.rows.length > 0) {
                // Already installed system
                socket.emit('registration-status', { 
                    exists: true, 
                    worker: res.rows[0] 
                });
            } else {
                // New system
                socket.emit('registration-status', { exists: false });
            }
        } catch (err) {
            console.error(err);
        }
    });

    // Finalize Registration with Nickname
   // API Code - inside io.on('connection')
socket.on('register-new-worker', async (info) => {
    try {
        const { machineId, nickname, ip, os } = info;
        
        // Generate Unique ID
        const countRes = await pool.query('SELECT COUNT(*) FROM worker_registry');
        const uniqueId = `sane-tester-${(parseInt(countRes.rows[0].count) + 1).toString().padStart(3, '0')}`;

        // Insert into DB with status 'online'
        await pool.query(
            'INSERT INTO worker_registry (worker_id, nickname, machine_id, system_ip, os_platform, status) VALUES ($1, $2, $3, $4, $5, $6)',
            [uniqueId, nickname, machineId, ip, os, 'online']
        );

        console.log(`✅ New Worker Registered: ${nickname}`);
        
        // Join Socket Room
        socket.join(uniqueId);
        // Refresh the Brain Dashboard
        io.emit('update-brain');
        
        // Tell the worker they are ready
        socket.emit('registered-successfully', { worker_id: uniqueId, nickname: nickname });

    } catch (err) {
        console.error("❌ Registration Error:", err.message);
    }
});

    // 2. Worker Action: Deactivate / Remove
    socket.on('update-worker-status', async (data) => {
    const { workerId, action } = data;
    
    if (action === 'remove') {
        await pool.query('DELETE FROM worker_registry WHERE worker_id = $1', [workerId]);
        console.log(`🗑️ Worker ${workerId} deleted from DB.`);
        io.emit('update-brain'); // Dashboard-la irundhu card disappear aagidum
        socket.emit('update-brain'); // Worker-ku "Success" message anuppum
    } else {
        // Normal online/offline logic
        const status = (action === 'active') ? 'online' : 'offline';
        await pool.query('UPDATE worker_registry SET status = $1 WHERE worker_id = $2', [status, workerId]);
        io.emit('update-brain');
    }
});

    // 3. Task Management (Brain -> API -> Worker)
    socket.on('send-task-to-worker', async (taskData) => {
        const { workerId, prompt, url } = taskData;
        try {
            // Store task in DB first
            const taskRes = await pool.query(
                'INSERT INTO tasks (worker_id, prompt, status) VALUES ($1, $2, $3) RETURNING id',
                [workerId, prompt || url, 'pending']
            );
            const taskId = taskRes.rows[0].id;

            // Forward to specific worker via Room
            io.to(workerId).emit('execute-task', {
                taskId: taskId,
                url: url,
                prompt: prompt
            });
            
            console.log(`Task ${taskId} forwarded to ${workerId}`);
        } catch (err) {
            console.error(err);
        }
    });

    // 4. Result Handling (Worker -> API -> Brain)
    socket.on('task-finished', async (result) => {
        const { taskId, workerId, status, screenshot, error } = result;
        try {
            // Update DB with result
            await pool.query(
                'UPDATE tasks SET status = $1, result_data = $2 WHERE id = $3',
                [status, JSON.stringify({ screenshot, error }), taskId]
            );

            // Inform Brain
            io.emit('task-completed-alert', { workerId, status, taskId });
        } catch (err) {
            console.error(err);
        }
    });

    socket.on('disconnect', () => {
        console.log('User disconnected');
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Sane-AI Central API running on port ${PORT}`);
});