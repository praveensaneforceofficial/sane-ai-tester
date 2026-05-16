const taskRepository = require('../repositories/taskRepository');

class TaskService {
    async createTask(workerId, taskData) {
        const { prompt, url } = taskData;
        const task = await taskRepository.create({
            workerId,
            prompt: prompt || url,
            status: 'pending'
        });
        return task;
    }

    async completeTask(taskId, resultData) {
        const { status, screenshot, error, data } = resultData;
        const result = { screenshot, error, data };
        
        const task = await taskRepository.updateComplete(taskId, status, result);
        return task;
    }

    async getTaskHistory(workerId, limit = 10) {
        const tasks = await taskRepository.findByWorkerId(workerId, limit);
        return tasks.map(t => t.toJSON());
    }
}

module.exports = new TaskService();