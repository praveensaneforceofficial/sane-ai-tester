const analyticsService = require('../services/analyticsService');

class AnalyticsController {
    async getDashboardMetrics(req, res) {
        try {
            const metrics = await analyticsService.getDashboard();
            res.json(metrics);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    async getWorkerAnalytics(req, res) {
        try {
            const stats = await analyticsService.getWorkerStats();
            res.json(stats);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    async getTaskAnalytics(req, res) {
        try {
            const stats = await analyticsService.getTaskStats();
            res.json(stats);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    async getErrorAnalytics(req, res) {
        try {
            const stats = await analyticsService.getErrorStats();
            res.json(stats);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    async getSuccessRate(req, res) {
        try {
            const rate = await analyticsService.getSuccessRate();
            res.json(rate);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    async getProjectAnalytics(req, res) {
        try {
            const stats = await analyticsService.getProjectStats();
            res.json(stats);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    async getTokenUsage(req, res) {
        try {
            const days = parseInt(req.query.days || 7);
            const usage = await analyticsService.getTokenUsage(days);
            res.json(usage);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    async getDailyMetrics(req, res) {
        try {
            const days = parseInt(req.query.days || 7);
            const metrics = await analyticsService.getDailyMetrics(days);
            res.json(metrics);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    async getWorkerPerformance(req, res) {
        try {
            const performance = await analyticsService.getWorkerPerformance();
            res.json(performance);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }
}

module.exports = new AnalyticsController();

