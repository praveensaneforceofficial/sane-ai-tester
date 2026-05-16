const aiUsageService = require('../services/aiUsageService');

class AiUsageController {
    async getAllUsage(req, res) {
        try {
            const logs = await aiUsageService.getAll();
            res.json(logs);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    async logAiUsage(req, res) {
        try {
            const log = await aiUsageService.log(req.body);
            res.status(201).json(log);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    async getUsageSummary(req, res) {
        try {
            const summary = await aiUsageService.getSummary();
            res.json(summary);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    async getTokenUsage(req, res) {
        try {
            const stats = await aiUsageService.getTokenStats();
            res.json(stats);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    async getUsageBySource(req, res) {
        try {
            const logs = await aiUsageService.getBySource(req.params.source);
            res.json(logs);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }
}

module.exports = new AiUsageController();
