const taskService = require('../services/taskService');

class TaskController {
    async getAllTasks(req, res) {
        try {
            const tasks = await taskService.getAll();
            res.json(tasks);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    async getTaskById(req, res) {
        try {
            const task = await taskService.getById(req.params.taskId);
            res.json(task);
        } catch (err) {
            res.status(404).json({ error: err.message });
        }
    }

    async createTask(req, res) {
        try {
            const task = await taskService.create(req.body);
            res.status(201).json(task);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    async updateTaskStatus(req, res) {
        try {
            const { taskId } = req.params;
            const { status, error } = req.body;
            const result = await taskService.updateStatus(taskId, status, error);
            res.json(result);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    async assignTask(req, res) {
        try {
            const { taskId } = req.params;
            const { workerId } = req.body;
            const result = await taskService.assign(taskId, workerId);
            res.json(result);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    async retryTask(req, res) {
        try {
            const { taskId } = req.params;
            const result = await taskService.retry(taskId);
            res.json(result);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    async cancelTask(req, res) {
        try {
            const { taskId } = req.params;
            await taskService.cancel(taskId);
            res.status(204).send();
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    async getTasksByWorker(req, res) {
        try {
            const { workerId } = req.params;
            const tasks = await taskService.getByWorker(workerId);
            res.json(tasks);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    async getTasksByStatus(req, res) {
        try {
            const { status } = req.params;
            const tasks = await taskService.getByStatus(status);
            res.json(tasks);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    async addTaskAction(req, res) {
        try {
            const { taskId } = req.params;
            const action = await taskService.addAction(taskId, req.body);
            res.status(201).json(action);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    async getTaskActions(req, res) {
        try {
            const { taskId } = req.params;
            const actions = await taskService.getActions(taskId);
            res.json(actions);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }
}

module.exports = new TaskController();