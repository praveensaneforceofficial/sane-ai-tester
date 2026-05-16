const express = require('express');
const router = express.Router();
const aiUsageController = require('../controllers/aiUsageController');

router.get('/', aiUsageController.getAllUsage);
router.post('/', aiUsageController.logAiUsage);
router.get('/summary', aiUsageController.getUsageSummary);
router.get('/tokens', aiUsageController.getTokenUsage);
router.get('/source/:source', aiUsageController.getUsageBySource);

module.exports = router;
