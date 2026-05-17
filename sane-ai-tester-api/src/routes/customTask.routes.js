const express = require('express');
const router = express.Router();
const customTaskController = require('../controllers/customTaskController');

router.post('/', customTaskController.createCustomTask);
router.get('/', customTaskController.getAllCustomTasks);
router.put('/:customTaskId/status', customTaskController.updateCustomTaskStatus);
router.put('/:customTaskId', customTaskController.updateCustomTask);
router.delete('/:customTaskId', customTaskController.deleteCustomTask);
router.get('/:customTaskId/actions', customTaskController.getCustomTaskActions);

module.exports = router;
