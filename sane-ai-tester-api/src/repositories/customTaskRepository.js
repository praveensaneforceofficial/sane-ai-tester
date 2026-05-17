const db = require('../config/database');

class CustomTaskRepository {
    async create(taskData) {
        const { custom_task_id, project_jobj_id, title, description, priority, status } = taskData;
        const result = await db.query(
            `INSERT INTO custom_tasks 
             (custom_task_id, project_jobj_id, title, description, priority, status, created_at, updated_at) 
             VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW()) 
             RETURNING *`,
            [custom_task_id, project_jobj_id, title, description, priority || 'medium', status || 'todo']
        );
        return result.rows[0];
    }

    async getAll() {
        const result = await db.query(
            `SELECT ct.*, zp.project_name 
             FROM custom_tasks ct
             LEFT JOIN zoho_projects zp ON ct.project_jobj_id = zp.project_jobj_id
             ORDER BY ct.created_at DESC`
        );
        return result.rows;
    }

    async updateStatus(customTaskId, status) {
        const result = await db.query(
            `UPDATE custom_tasks 
             SET status = $1, updated_at = NOW() 
             WHERE custom_task_id = $2 
             RETURNING *`,
            [status, customTaskId]
        );
        return result.rows[0];
    }

    async delete(customTaskId) {
        await db.query(`DELETE FROM custom_tasks WHERE custom_task_id = $1`, [customTaskId]);
        return true;
    }
}

module.exports = new CustomTaskRepository();
