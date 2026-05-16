const express = require('express');
const router = express.Router();
const errorController = require('../controllers/errorController');

router.get('/', errorController.getAllErrors);
router.post('/', errorController.createErrorLog);
router.get('/task/:taskId', errorController.getErrorsByTask);
router.get('/worker/:workerId', errorController.getErrorsByWorker);
router.get('/severity/:severity', errorController.getErrorsBySeverity);
router.get('/:errorId', errorController.getErrorById);
router.put('/:errorId/resolve', errorController.resolveError);

module.exports = router;
