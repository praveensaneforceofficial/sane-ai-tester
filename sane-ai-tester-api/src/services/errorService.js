const errorRepository = require('../repositories/errorRepository');

class ErrorService {
    async getAll() {
        const errors = await errorRepository.findAll();
        return errors.map(e => e.toJSON());
    }

    async getById(errorId) {
        const error = await errorRepository.findById(errorId);
        if (!error) throw new Error('Error log not found');
        return error.toJSON();
    }

    async create(errorData) {
        if (!errorData.error_id) {
            errorData.error_id = `err-${Date.now()}`;
        }
        const error = await errorRepository.create(errorData);
        return error.toJSON();
    }

    async getByTask(taskId) {
        const errors = await errorRepository.findByTask(taskId);
        return errors.map(e => e.toJSON());
    }

    async getByWorker(workerId) {
        const errors = await errorRepository.findByWorker(workerId);
        return errors.map(e => e.toJSON());
    }

    async resolve(errorId) {
        const error = await errorRepository.resolve(errorId);
        if (!error) throw new Error('Error log not found');
        return error.toJSON();
    }

    async getBySeverity(severity) {
        const errors = await errorRepository.findBySeverity(severity);
        return errors.map(e => e.toJSON());
    }
}

module.exports = new ErrorService();
