const customTaskRepository = require('../repositories/customTaskRepository');

class CustomTaskService {
    async create(taskData) {
        if (!taskData.project_jobj_id) {
            throw new Error('Project ID is required');
        }
        if (!taskData.title) {
            throw new Error('Task title/name is required');
        }
        
        const custom_task_id = `CT-${Date.now()}`;
        return await customTaskRepository.create({
            ...taskData,
            custom_task_id,
            status: taskData.status || 'todo'
        });
    }

    async getAll() {
        return await customTaskRepository.getAll();
    }

    async updateStatus(customTaskId, status) {
        if (!status) {
            throw new Error('Status is required');
        }
        return await customTaskRepository.updateStatus(customTaskId, status);
    }

    async update(customTaskId, updateData) {
        return await customTaskRepository.update(customTaskId, updateData);
    }

    async delete(customTaskId) {
        return await customTaskRepository.delete(customTaskId);
    }
}

module.exports = new CustomTaskService();
