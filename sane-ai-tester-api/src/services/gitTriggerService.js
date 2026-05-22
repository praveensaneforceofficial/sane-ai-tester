const gitTriggerRepository = require('../repositories/gitTriggerRepository');

class GitTriggerService {
    async create(triggerData) {
        const trigger = await gitTriggerRepository.create(triggerData);
        return trigger.toJSON();
    }

    async getAll() {
        const triggers = await gitTriggerRepository.findAll();
        return triggers.map(t => t.toJSON());
    }

    async getById(id) {
        const trigger = await gitTriggerRepository.findById(id);
        if (!trigger) throw new Error('Trigger record not found');
        return trigger.toJSON();
    }

    async updateStatus(id, status) {
        const trigger = await gitTriggerRepository.updateStatus(id, status);
        if (!trigger) throw new Error('Trigger record not found');
        return trigger.toJSON();
    }

    async delete(id) {
        const deleted = await gitTriggerRepository.delete(id);
        if (!deleted) throw new Error('Trigger record not found');
        return true;
    }
}

module.exports = new GitTriggerService();
