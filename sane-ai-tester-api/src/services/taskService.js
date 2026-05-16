const taskRepository = require('../repositories/taskRepository');

class TaskService {
    async getAll() {
        const tasks = await taskRepository.findAll();
        return tasks.map(t => t.toJSON());
    }

    async getById(taskId) {
        const task = await taskRepository.findById(taskId);
        if (!task) throw new Error('Task not found');
        return task.toJSON();
    }

    async create(taskData) {
        // Generate task ID if not provided
        if (!taskData.task_id) {
            taskData.task_id = `task-${Date.now()}`;
        }
        const task = await taskRepository.create(taskData);
        return task.toJSON();
    }

    async updateStatus(taskId, status, error) {
        const task = await taskRepository.updateStatus(taskId, status, error);
        if (!task) throw new Error('Task not found');
        return task.toJSON();
    }

    async assign(taskId, workerId) {
        const task = await taskRepository.assignToWorker(taskId, workerId);
        if (!task) throw new Error('Task not found');
        return task.toJSON();
    }

    async retry(taskId) {
        const task = await taskRepository.findById(taskId);
        if (!task) throw new Error('Task not found');
        
        const retriedTask = await taskRepository.updateStatus(taskId, 'pending');
        return retriedTask.toJSON();
    }

    async cancel(taskId) {
        const deleted = await taskRepository.delete(taskId);
        if (!deleted) throw new Error('Task not found');
        return true;
    }

    async getByWorker(workerId) {
        const tasks = await taskRepository.findByWorkerId(workerId);
        return tasks.map(t => t.toJSON());
    }

    async getByStatus(status) {
        const tasks = await taskRepository.findByStatus(status);
        return tasks.map(t => t.toJSON());
    }

    async addAction(taskId, actionData) {
        return await taskRepository.createAction(taskId, actionData);
    }

    async getActions(taskId) {
        return await taskRepository.findActionsByTaskId(taskId);
    }
}

module.exports = new TaskService();