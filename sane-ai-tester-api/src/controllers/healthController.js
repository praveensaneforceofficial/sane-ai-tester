class HealthController {
    check(req, res) {
        res.json({ 
            status: 'healthy', 
            timestamp: new Date().toISOString() 
        });
    }

    async refreshStatus(req, res) {
        try {
            const heartbeatService = require('../services/heartbeatService');
            await heartbeatService.check();
            res.json({ success: true, message: 'Status refreshed' });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }
}

module.exports = new HealthController();