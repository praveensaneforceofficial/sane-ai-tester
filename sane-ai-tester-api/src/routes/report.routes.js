const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');

router.get('/', reportController.getAllReports);
router.post('/', reportController.generateReport);
router.get('/task/:taskId', reportController.getReportByTask);
router.get('/worker/:workerId', reportController.getReportsByWorker);
router.get('/project/:projectName', reportController.getReportsByProject);
router.get('/:reportId', reportController.getReportById);
router.delete('/:reportId', reportController.deleteReport);
router.get('/:reportId/download', reportController.downloadReport);

module.exports = router;
