const db = require('../config/database');
const TaskModel = require('../models/task.model');

class TaskRepository {
    async findAll() {
        const result = await db.query('SELECT * FROM tasks ORDER BY created_at DESC');
        return result.rows.map(row => new TaskModel(row));
    }

    async findById(taskId) {
        const result = await db.query('SELECT * FROM tasks WHERE task_id = $1', [taskId]);
        return result.rows[0] ? new TaskModel(result.rows[0]) : null;
    }

    async create(taskData) {
        const { task_id, worker_id, prompt, url, priority = 'medium' } = taskData;
        const result = await db.query(
            `INSERT INTO tasks (task_id, worker_id, prompt, url, priority, status, created_at) 
             VALUES ($1, $2, $3, $4, $5, 'pending', NOW()) 
             RETURNING *`,
            [task_id, worker_id, prompt, url, priority]
        );
        return new TaskModel(result.rows[0]);
    }

    async updateStatus(taskId, status, error = null) {
        const result = await db.query(
            `UPDATE tasks 
             SET status = $1::varchar, 
                 error_message = $2::text, 
                 completed_at = CASE WHEN $1::varchar IN ('completed', 'failed') THEN NOW() ELSE completed_at END,
                 updated_at = NOW() 
             WHERE task_id = $3 
             RETURNING *`,
            [status, error, taskId]
        );
        return result.rows[0] ? new TaskModel(result.rows[0]) : null;
    }

    async assignToWorker(taskId, workerId) {
        const result = await db.query(
            'UPDATE tasks SET worker_id = $1, status = $2, started_at = NOW(), updated_at = NOW() WHERE task_id = $3 RETURNING *',
            [workerId, 'in_progress', taskId]
        );
        return result.rows[0] ? new TaskModel(result.rows[0]) : null;
    }

    async delete(taskId) {
        const result = await db.query('DELETE FROM tasks WHERE task_id = $1 RETURNING task_id', [taskId]);
        return result.rows.length > 0;
    }

    async findByWorkerId(workerId) {
        const result = await db.query(
            'SELECT * FROM tasks WHERE worker_id = $1 ORDER BY created_at DESC',
            [workerId]
        );
        return result.rows.map(row => new TaskModel(row));
    }

    async findByStatus(status) {
        const result = await db.query(
            'SELECT * FROM tasks WHERE status = $1 ORDER BY created_at DESC',
            [status]
        );
        return result.rows.map(row => new TaskModel(row));
    }

    async createAction(taskId, actionData) {
        const { step_number, action_type, selector, value, screenshot_path, success, error_message } = actionData;
        const result = await db.query(
            `INSERT INTO task_actions (task_id, step_number, action_type, selector, value, screenshot_path, success, error_message, executed_at) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW()) 
             RETURNING *`,
            [taskId, step_number, action_type, selector, value, screenshot_path, success, error_message]
        );
        return result.rows[0];
    }

    async findActionsByTaskId(taskId) {
        const result = await db.query(
            'SELECT * FROM task_actions WHERE task_id = $1 ORDER BY step_number ASC',
            [taskId]
        );
        return result.rows;
    }
}

module.exports = new TaskRepository();