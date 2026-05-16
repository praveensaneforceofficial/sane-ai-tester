const express = require('express');
const router = express.Router();
const healthController = require('../controllers/healthController');

router.get('/health', healthController.check);
router.post('/refresh-status', healthController.refreshStatus);

module.exports = router;