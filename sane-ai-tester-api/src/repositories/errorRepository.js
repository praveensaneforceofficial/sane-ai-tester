const db = require('../config/database');
const ErrorLogModel = require('../models/errorLog.model');

class ErrorRepository {
    async findAll() {
        const result = await db.query('SELECT * FROM error_logs ORDER BY created_at DESC');
        return result.rows.map(row => new ErrorLogModel(row));
    }

    async findById(errorId) {
        const result = await db.query('SELECT * FROM error_logs WHERE error_id = $1', [errorId]);
        return result.rows[0] ? new ErrorLogModel(result.rows[0]) : null;
    }

    async create(errorData) {
        const { error_id, task_id, worker_id, error_type, error_message, stack_trace, screenshot_path, video_path, severity, ai_analysis } = errorData;
        const result = await db.query(
            `INSERT INTO error_logs 
             (error_id, task_id, worker_id, error_type, error_message, stack_trace, screenshot_path, video_path, severity, ai_analysis, created_at) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW()) 
             RETURNING *`,
            [error_id, task_id, worker_id, error_type, error_message, stack_trace, screenshot_path, video_path, severity, ai_analysis]
        );
        return new ErrorLogModel(result.rows[0]);
    }

    async findByTask(taskId) {
        const result = await db.query('SELECT * FROM error_logs WHERE task_id = $1', [taskId]);
        return result.rows.map(row => new ErrorLogModel(row));
    }

    async findByWorker(workerId) {
        const result = await db.query('SELECT * FROM error_logs WHERE worker_id = $1 ORDER BY created_at DESC', [workerId]);
        return result.rows.map(row => new ErrorLogModel(row));
    }

    async resolve(errorId) {
        const result = await db.query(
            'UPDATE error_logs SET resolved = TRUE, resolved_at = NOW() WHERE error_id = $1 RETURNING *',
            [errorId]
        );
        return result.rows[0] ? new ErrorLogModel(result.rows[0]) : null;
    }

    async findBySeverity(severity) {
        const result = await db.query('SELECT * FROM error_logs WHERE severity = $1 ORDER BY created_at DESC', [severity]);
        return result.rows.map(row => new ErrorLogModel(row));
    }
}

module.exports = new ErrorRepository();
