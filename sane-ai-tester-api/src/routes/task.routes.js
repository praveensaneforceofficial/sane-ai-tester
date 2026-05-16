const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');

router.post('/', taskController.createTask);
router.get('/', taskController.getAllTasks);
router.get('/:taskId', taskController.getTaskById);
router.put('/:taskId/status', taskController.updateTaskStatus);
router.put('/:taskId/assign', taskController.assignTask);
router.post('/:taskId/retry', taskController.retryTask);
router.delete('/:taskId', taskController.cancelTask);
router.get('/worker/:workerId', taskController.getTasksByWorker);
router.get('/status/:status', taskController.getTasksByStatus);
router.post('/:taskId/actions', taskController.addTaskAction);
router.get('/:taskId/actions', taskController.getTaskActions);

module.exports = router;