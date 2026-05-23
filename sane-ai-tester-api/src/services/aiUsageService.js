const aiUsageRepository = require('../repositories/aiUsageRepository');
const brainBridge = require('./brainWebSocketBridge');

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
        const logJson = log.toJSON();
        
        if (brainBridge.io) {
            brainBridge.io.emit('update-brain');
            brainBridge.io.emit('dashboard:update');
            brainBridge.io.emit('ai-usage:logged', logJson);
        }
        
        return logJson;
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
