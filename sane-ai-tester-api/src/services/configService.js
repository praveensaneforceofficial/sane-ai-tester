const configRepository = require('../repositories/configRepository');

class ConfigService {
    async getAll() {
        const configs = await configRepository.findAll();
        return configs.map(c => c.toJSON());
    }

    async getByKey(key) {
        const config = await configRepository.findByKey(key);
        if (!config) throw new Error('Configuration key not found');
        return config.toJSON();
    }

    async create(configData) {
        const config = await configRepository.create(configData);
        return config.toJSON();
    }

    async update(key, configData) {
        const config = await configRepository.update(key, configData);
        if (!config) throw new Error('Configuration key not found');
        return config.toJSON();
    }
}

module.exports = new ConfigService();
