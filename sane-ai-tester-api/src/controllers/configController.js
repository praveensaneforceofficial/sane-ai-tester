const configService = require('../services/configService');

class ConfigController {
    async getAllConfigs(req, res) {
        try {
            const configs = await configService.getAll();
            res.json(configs);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    async getConfigByKey(req, res) {
        try {
            const config = await configService.getByKey(req.params.key);
            res.json(config);
        } catch (err) {
            res.status(404).json({ error: err.message });
        }
    }

    async createConfig(req, res) {
        try {
            const config = await configService.create(req.body);
            res.status(201).json(config);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    async updateConfig(req, res) {
        try {
            const result = await configService.update(req.params.key, req.body);
            res.json(result);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }
}

module.exports = new ConfigController();
