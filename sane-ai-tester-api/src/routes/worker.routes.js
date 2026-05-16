const express = require('express');
const router = express.Router();
const workerController = require('../controllers/workerController');

router.get('/', workerController.getAllWorkers);
router.get('/online', workerController.getOnlineWorkers);
router.get('/:workerId', workerController.getWorkerById);
router.post('/register', workerController.registerWorker);
router.put('/:workerId/status', workerController.updateWorkerStatus);
router.put('/:workerId', workerController.updateWorker);
router.delete('/:workerId', workerController.deleteWorker);
router.get('/:workerId/heartbeat', workerController.getWorkerHeartbeats);

module.exports = router;