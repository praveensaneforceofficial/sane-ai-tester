const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');

router.get('/:workerId', taskController.getTaskHistory);

module.exports = router;