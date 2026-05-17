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
app.use('/api', healthRoutes);
app.use('/api', sprintRoutes);

// Initialize Database
database.connect();

// Initialize WebSocket
const socketManager = new SocketManager(io);
socketManager.initialize();

// Error handling
server.on('error', (error) => {
    console.error('❌ Server error:', error);
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