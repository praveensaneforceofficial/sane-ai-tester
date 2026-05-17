const customTaskService = require('../services/customTaskService');

class CustomTaskController {
    async createCustomTask(req, res) {
        try {
            const task = await customTaskService.create(req.body);
            res.status(201).json(task);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    async getAllCustomTasks(req, res) {
        try {
            const tasks = await customTaskService.getAll();
            res.json(tasks);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    async updateCustomTaskStatus(req, res) {
        try {
            const { customTaskId } = req.params;
            const { status } = req.body;
            const task = await customTaskService.updateStatus(customTaskId, status);
            res.json(task);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    async updateCustomTask(req, res) {
        try {
            const { customTaskId } = req.params;
            const task = await customTaskService.update(customTaskId, req.body);
            res.json(task);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    async deleteCustomTask(req, res) {
        try {
            const { customTaskId } = req.params;
            await customTaskService.delete(customTaskId);
            res.status(204).send();
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    async getCustomTaskActions(req, res) {
        try {
            const { customTaskId } = req.params;
            const actions = await customTaskService.getActions(customTaskId);
            res.json(actions);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }
}

module.exports = new CustomTaskController();
