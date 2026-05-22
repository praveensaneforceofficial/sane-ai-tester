const express = require('express');
const router = express.Router();
const healthController = require('../controllers/healthController');
const db = require('../config/database');

router.get('/health', healthController.healthCheck);
router.get('/health/detailed', healthController.detailedHealthCheck);
router.get('/health/metrics', healthController.getSystemMetrics);
router.get('/health/workers', healthController.getWorkerHealth);
router.post('/refresh-status', healthController.refreshStatus);

// Quick DB connectivity diagnostic
router.get('/db-status', (req, res) => {
    res.json({
        connected: db.isConnected(),
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        database: process.env.DB_NAME,
        timestamp: new Date().toISOString()
    });
});

module.exports = router;