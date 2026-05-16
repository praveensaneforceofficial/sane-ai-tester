const express = require('express');
const router = express.Router();
const configController = require('../controllers/configController');

router.get('/', configController.getAllConfigs);
router.post('/', configController.createConfig);
router.get('/:key', configController.getConfigByKey);
router.put('/:key', configController.updateConfig);

module.exports = router;
