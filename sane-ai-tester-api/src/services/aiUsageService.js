const aiUsageRepository = require('../repositories/aiUsageRepository');

class AiUsageService {
    async getAll() {
        const logs = await aiUsageRepository.findAll();
        return logs.map(l => l.toJSON());
    }

    async log(usageData) {
        if (!usageData.usage_id) {
            usageData.usage_id = `usage-${Date.now()}`;
        }
        const log = await aiUsageRepository.create(usageData);
        return log.toJSON();
    }

    async getSummary() {
        return await aiUsageRepository.getSummary();
    }

    async getTokenStats() {
        return await aiUsageRepository.getTokenStats();
    }

    async getBySource(source) {
        const logs = await aiUsageRepository.findBySource(source);
        return logs.map(l => l.toJSON());
    }
}

module.exports = new AiUsageService();
