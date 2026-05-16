const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');

router.get('/dashboard', analyticsController.getDashboardMetrics);
router.get('/workers', analyticsController.getWorkerAnalytics);
router.get('/tasks', analyticsController.getTaskAnalytics);
router.get('/errors', analyticsController.getErrorAnalytics);
router.get('/success-rate', analyticsController.getSuccessRate);
router.get('/projects', analyticsController.getProjectAnalytics);

module.exports = router;
