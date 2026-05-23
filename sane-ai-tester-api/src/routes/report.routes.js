const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');

router.get('/', reportController.getAllReports);
router.post('/', reportController.generateReport);

// Brain-equivalent report endpoints — now served directly from DB
router.get('/test-summary', reportController.getTestSummary);
router.get('/failed-tests', reportController.getFailedTests);
router.post('/export', reportController.exportReport);

router.get('/task/:taskId', reportController.getReportByTask);
router.get('/worker/:workerId', reportController.getReportsByWorker);
router.get('/project/:projectName', reportController.getReportsByProject);
router.get('/:reportId', reportController.getReportById);
router.delete('/:reportId', reportController.deleteReport);
router.get('/:reportId/download', reportController.downloadReport);

module.exports = router;
