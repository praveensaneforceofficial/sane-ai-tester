const express = require('express');
const router = express.Router();
const workerController = require('../controllers/workerController');

router.get('/', workerController.getAllWorkers);
router.get('/:workerId', workerController.getWorkerById);
router.put('/:workerId/status', workerController.updateWorkerStatus);

module.exports = router;