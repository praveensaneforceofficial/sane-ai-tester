const db = require('../config/database');
const TaskModel = require('../models/task.model');

class TaskRepository {
    async create(taskData) {
        const { workerId, prompt, status } = taskData;
        const result = await db.query(
            'INSERT INTO tasks (worker_id, prompt, status, created_at) VALUES ($1, $2, $3, NOW()) RETURNING id',
            [workerId, prompt, status]
        );
        return { id: result.rows[0].id };
    }

    async updateStatus(taskId, status, resultData = null) {
        const query = resultData 
            ? 'UPDATE tasks SET status = $1, result_data = $2, completed_at = NOW() WHERE id = $3 RETURNING *'
            : 'UPDATE tasks SET status = $1, completed_at = NOW() WHERE id = $2 RETURNING *';
        
        const params = resultData 
            ? [status, JSON.stringify(resultData), taskId]
            : [status, taskId];
        
        const result = await db.query(query, params);
        return result.rows[0] ? new TaskModel(result.rows[0]) : null;
    }

    async findByWorkerId(workerId, limit = 10) {
        const result = await db.query(
            'SELECT * FROM tasks WHERE worker_id = $1 ORDER BY created_at DESC LIMIT $2',
            [workerId, limit]
        );
        return result.rows.map(row => new TaskModel(row));
    }

    async updateComplete(taskId, status, resultData) {
        const result = await db.query(
            'UPDATE tasks SET status = $1, result_data = $2, completed_at = NOW() WHERE id = $3 RETURNING *',
            [status, JSON.stringify(resultData), taskId]
        );
        return result.rows[0] ? new TaskModel(result.rows[0]) : null;
    }
}

module.exports = new TaskRepository();