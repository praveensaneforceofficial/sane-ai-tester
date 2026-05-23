const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');

router.get('/dashboard', analyticsController.getDashboardMetrics);
router.get('/workers', analyticsController.getWorkerAnalytics);
router.get('/tasks', analyticsController.getTaskAnalytics);
router.get('/errors', analyticsController.getErrorAnalytics);
router.get('/success-rate', analyticsController.getSuccessRate);
router.get('/projects', analyticsController.getProjectAnalytics);

// Brain-equivalent analytics — now served directly from DB
router.get('/token-usage', analyticsController.getTokenUsage);
router.get('/daily-metrics', analyticsController.getDailyMetrics);
router.get('/worker-performance', analyticsController.getWorkerPerformance);

module.exports = router;
