const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const database = require('./config/database');
const SocketManager = require('./socket/socketManager');
const authRoutes = require('./routes/auth.routes');
const workerRoutes = require('./routes/worker.routes');
const taskRoutes = require('./routes/task.routes');
const projectRoutes = require('./routes/project.routes');
const ticketRoutes = require('./routes/ticket.routes');
const reportRoutes = require('./routes/report.routes');
const errorRoutes = require('./routes/error.routes');
const analyticsRoutes = require('./routes/analytics.routes');
const aiUsageRoutes = require('./routes/aiUsage.routes');
const configRoutes = require('./routes/config.routes');
const healthRoutes = require('./routes/health.routes');
const { router: sprintRoutes } = require('./routes/sprint.routes');
const customTaskRoutes = require('./routes/customTask.routes');
const brainRoutes = require('./routes/brain.routes');
const APP_VERSION = '22-MAY-2026-BUILD-1';
const app = express();
const server = http.createServer(app);
const io = new Server(server, { 
    cors: { 
        origin: "*",
        methods: ["GET", "POST"]
    } 
});

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/workers', workerRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/errors', errorRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/ai-usage', aiUsageRoutes);
app.use('/api/config', configRoutes);
app.use('/api/custom-tasks', customTaskRoutes);
app.use('/api/brain', brainRoutes);
app.use('/api', healthRoutes);
app.use('/api', sprintRoutes);

app.get('/version', (req, res) => {
    res.json({
        version: APP_VERSION,
        time: new Date(),
        pid: process.pid
    });
});

// Initialize Database
database.connect();

// Initialize WebSocket
const socketManager = new SocketManager(io);
socketManager.initialize();

// Initialize Brain WebSocket Bridge
const brainBridge = require('./services/brainWebSocketBridge');
brainBridge.initialize(io);

// ⏰ Worker Health Checker — runs every 60 seconds
// Marks workers offline if they haven't sent a heartbeat in 60s
const workerRepository = require('./repositories/workerRepository');

const startWorkerHealthChecker = () => {
    setInterval(async () => {
        // Skip health check if DB is not connected
        if (!database.isConnected()) {
            console.log('⏰ Health Check: Skipped — DB not connected');
            return;
        }
        try {
            const markedOffline = await workerRepository.markOfflineInactive();
            if (markedOffline.length > 0) {
                console.log(`⏰ Health Check: Marked ${markedOffline.length} worker(s) offline:`, 
                    markedOffline.map(w => w.nickname).join(', '));
                // Notify dashboard to refresh worker list
                io.emit('update-brain');
                io.emit('dashboard:update');
                markedOffline.forEach(w => {
                    io.emit('worker:offline', { workerId: w.worker_id });
                });
            } else {
                console.log(`⏰ Health Check: All workers are active`);
            }
        } catch (err) {
            console.error('❌ Worker health check error:', err.message);
        }
    }, 60 * 1000); // every 60 seconds
    console.log('⏰ Worker health checker started (60s interval)');
};

startWorkerHealthChecker();

// Error handling
server.on('error', (error) => {
    console.error('❌ Server error:', error);
});

// Global crash protection
process.on('uncaughtException', (err) => {
    console.error('❌ Uncaught Exception (server kept alive):', err.message);
});

process.on('unhandledRejection', (reason) => {
    console.error('❌ Unhandled Promise Rejection (server kept alive):', reason);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing HTTP server');
    server.close(() => {
        console.log('HTTP server closed');
        database.close();
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('SIGINT signal received: closing HTTP server');
    server.close(() => {
        console.log('HTTP server closed');
        database.close();
        process.exit(0);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════════════════════════════╗
║     🧠 SANE-AI CENTRAL API SERVER                              ║
║     🚀 Running on port: ${PORT}                                ║
║     📡 WebSocket: ws://localhost:${PORT}                       ║
║     🔗 REST API: http://localhost:${PORT}/api                  ║
║     ⏰ Auto-offline: 60 seconds timeout                        ║
╚════════════════════════════════════════════════════════════════╝
    `);
});