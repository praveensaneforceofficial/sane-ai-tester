const os = require('os');
const db = require('../config/database');

class HealthController {
    healthCheck(req, res) {
        res.json({ 
            status: 'healthy', 
            timestamp: new Date().toISOString() 
        });
    }

    async detailedHealthCheck(req, res) {
        try {
            // Check DB
            const dbCheck = await db.query('SELECT 1');
            
            res.json({
                status: 'healthy',
                timestamp: new Date().toISOString(),
                database: dbCheck ? 'connected' : 'disconnected',
                system: {
                    uptime: os.uptime(),
                    platform: os.platform(),
                    memory: {
                        total: os.totalmem(),
                        free: os.freemem()
                    },
                    load: os.loadavg()
                }
            });
        } catch (err) {
            res.status(500).json({ 
                status: 'unhealthy', 
                error: err.message,
                timestamp: new Date().toISOString()
            });
        }
    }

    async getSystemMetrics(req, res) {
        try {
            const metrics = await db.query(`
                SELECT 
                    (SELECT COUNT(*) FROM tasks) as total_tasks,
                    (SELECT COUNT(*) FROM worker_registry) as total_workers,
                    (SELECT COUNT(*) FROM error_logs) as total_errors
            `);
            res.json({
                timestamp: new Date().toISOString(),
                metrics: metrics.rows[0]
            });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    async getWorkerHealth(req, res) {
        try {
            const workers = await db.query(`
                SELECT 
                    status,
                    COUNT(*) as count
                FROM worker_registry
                GROUP BY status
            `);
            res.json(workers.rows);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    async refreshStatus(req, res) {
        try {
            const workerRepository = require('../repositories/workerRepository');
            const offlineWorkers = await workerRepository.markOfflineInactive();
            res.json({ 
                success: true, 
                message: 'Status refreshed',
                marked_offline: offlineWorkers.length
            });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }
}

module.exports = new HealthController();