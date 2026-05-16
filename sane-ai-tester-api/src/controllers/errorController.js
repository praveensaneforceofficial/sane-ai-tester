const errorService = require('../services/errorService');

class ErrorController {
    async getAllErrors(req, res) {
        try {
            const errors = await errorService.getAll();
            res.json(errors);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    async getErrorById(req, res) {
        try {
            const error = await errorService.getById(req.params.errorId);
            res.json(error);
        } catch (err) {
            res.status(404).json({ error: err.message });
        }
    }

    async createErrorLog(req, res) {
        try {
            const error = await errorService.create(req.body);
            res.status(201).json(error);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    async getErrorsByTask(req, res) {
        try {
            const errors = await errorService.getByTask(req.params.taskId);
            res.json(errors);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    async getErrorsByWorker(req, res) {
        try {
            const errors = await errorService.getByWorker(req.params.workerId);
            res.json(errors);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    async resolveError(req, res) {
        try {
            const result = await errorService.resolve(req.params.errorId);
            res.json(result);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    async getErrorsBySeverity(req, res) {
        try {
            const errors = await errorService.getBySeverity(req.params.severity);
            res.json(errors);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }
}

module.exports = new ErrorController();
