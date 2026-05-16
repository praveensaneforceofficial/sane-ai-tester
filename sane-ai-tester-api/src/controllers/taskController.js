const taskService = require('../services/taskService');

class TaskController {
    async getTaskHistory(req, res) {
        try {
            const { workerId } = req.params;
            const tasks = await taskService.getTaskHistory(workerId);
            res.json(tasks);
        } catch (err) {
            console.error('Error fetching tasks:', err);
            res.status(500).json({ error: err.message });
        }
    }
}

module.exports = new TaskController();