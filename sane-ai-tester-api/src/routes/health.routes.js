const express = require('express');
const router = express.Router();
const healthController = require('../controllers/healthController');

router.get('/health', healthController.healthCheck);
router.get('/health/detailed', healthController.detailedHealthCheck);
router.get('/health/metrics', healthController.getSystemMetrics);
router.get('/health/workers', healthController.getWorkerHealth);
router.post('/refresh-status', healthController.refreshStatus);

module.exports = router;