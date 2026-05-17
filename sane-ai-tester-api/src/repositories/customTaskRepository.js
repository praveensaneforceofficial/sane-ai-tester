const db = require('../config/database');

class CustomTaskRepository {
    async addAction(customTaskId, actionType, description) {
        try {
            await db.query(
                `INSERT INTO custom_task_actions 
                 (custom_task_id, action_type, description, created_at) 
                 VALUES ($1, $2, $3, NOW())`,
                [customTaskId, actionType, description]
            );
        } catch (err) {
            console.error('Failed to log custom task action:', err);
        }
    }

    async getActions(customTaskId) {
        const result = await db.query(
            `SELECT * FROM custom_task_actions 
             WHERE custom_task_id = $1 
             ORDER BY created_at DESC`,
            [customTaskId]
        );
        return result.rows;
    }

    async create(taskData) {
        const { custom_task_id, project_jobj_id, title, description, priority, status } = taskData;
        const result = await db.query(
            `INSERT INTO custom_tasks 
             (custom_task_id, project_jobj_id, title, description, priority, status, created_at, updated_at) 
             VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW()) 
             RETURNING *`,
            [custom_task_id, project_jobj_id, title, description, priority || 'medium', status || 'todo']
        );
        
        // Log action
        await this.addAction(custom_task_id, 'Task Created', `Task was created with status: ${status || 'todo'}`);
        
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
        // Fetch current status before update to compare transitions
        const currentRes = await db.query(
            `SELECT status FROM custom_tasks WHERE custom_task_id = $1`,
            [customTaskId]
        );
        const oldStatus = currentRes.rows[0]?.status || '';

        const result = await db.query(
            `UPDATE custom_tasks 
             SET status = $1, updated_at = NOW() 
             WHERE custom_task_id = $2 
             RETURNING *`,
            [status, customTaskId]
        );
        
        // Construct highly descriptive "why" status messages
        let logMsg = `Status updated to: ${status}`;
        const oldLower = oldStatus.toLowerCase();
        const newLower = status.toLowerCase();

        if (oldLower === 'todo' && newLower === 'test case ready') {
            logMsg = `this ticket is valid so moving to test case. Status updated to: Test Case Ready`;
        } else if (oldLower === 'test case ready' && newLower === 'testing going') {
            logMsg = `test case completed so moving to test going. Status updated to: Testing Going`;
        } else if (newLower === 'todo') {
            logMsg = `user updated status. Status updated to: todo`;
        } else {
            logMsg = `Status updated to: ${status}`;
        }

        await this.addAction(customTaskId, 'Status Transition', logMsg);
        
        return result.rows[0];
    }

    async update(customTaskId, updateData) {
        // Fetch current status before update to compare transitions
        const currentRes = await db.query(
            `SELECT status FROM custom_tasks WHERE custom_task_id = $1`,
            [customTaskId]
        );
        const oldStatus = currentRes.rows[0]?.status || '';

        const fields = [];
        const values = [];
        let idx = 1;
        for (const [key, val] of Object.entries(updateData)) {
            fields.push(`${key} = $${idx}`);
            values.push(val);
            idx++;
        }
        values.push(customTaskId);
        const query = `UPDATE custom_tasks SET ${fields.join(', ')}, updated_at = NOW() WHERE custom_task_id = $${idx} RETURNING *`;
        const result = await db.query(query, values);
        
        // Log descriptive transitions or actions
        if (updateData.status) {
            const status = updateData.status;
            let logMsg = `Status updated to: ${status}`;
            const oldLower = oldStatus.toLowerCase();
            const newLower = status.toLowerCase();

            if (oldLower === 'todo' && newLower === 'test case ready') {
                logMsg = `this ticket is valid so moving to test case. Status updated to: Test Case Ready`;
            } else if (oldLower === 'test case ready' && newLower === 'testing going') {
                logMsg = `test case completed so moving to test going. Status updated to: Testing Going`;
            } else if (newLower === 'todo') {
                logMsg = `user updated status. Status updated to: todo`;
            } else {
                logMsg = `Status updated to: ${status}`;
            }
            await this.addAction(customTaskId, 'Status Transition', logMsg);
        } else if (updateData.test_instructions) {
            await this.addAction(customTaskId, 'Test Case Generation', `Test cases and possible scenarios written.`);
        } else if (updateData.task_id) {
            await this.addAction(customTaskId, 'Worker Assignment', `Assigned task to worker agent. Task run ID: ${updateData.task_id}`);
        } else if (updateData.description) {
            if (updateData.description.includes('[FAILED:')) {
                const failMatch = updateData.description.match(/\[FAILED:\s*([^\]]+)\]/);
                const reason = failMatch ? failMatch[1] : 'Execution failed';
                await this.addAction(customTaskId, 'AI Audit', `Execution failed: ${reason}`);
            } else if (updateData.description.includes('[SUCCESS:')) {
                const successMatch = updateData.description.match(/\[SUCCESS:\s*([^\]]+)\]/);
                const reason = successMatch ? successMatch[1] : 'Execution completed';
                await this.addAction(customTaskId, 'AI Audit', `Execution completed successfully: ${reason}`);
            } else {
                await this.addAction(customTaskId, 'Task Update', `Description updated.`);
            }
        }
        
        return result.rows[0];
    }

    async delete(customTaskId) {
        await db.query(`DELETE FROM custom_tasks WHERE custom_task_id = $1`, [customTaskId]);
        return true;
    }
}

module.exports = new CustomTaskRepository();
