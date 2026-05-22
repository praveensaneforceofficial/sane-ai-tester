const db = require('../config/database');
const GitTriggerModel = require('../models/gitTrigger.model');

class GitTriggerRepository {
    async create(triggerData) {
        const { branch, repository, pr_number, commit_sha, author, status = 'pending' } = triggerData;
        const result = await db.query(
            `INSERT INTO git_triggers (branch, repository, pr_number, commit_sha, author, status, created_at, updated_at) 
             VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW()) 
             RETURNING *`,
            [branch, repository, pr_number, commit_sha, author, status]
        );
        return new GitTriggerModel(result.rows[0]);
    }

    async findAll() {
        const result = await db.query('SELECT * FROM git_triggers ORDER BY created_at DESC');
        return result.rows.map(row => new GitTriggerModel(row));
    }

    async findById(id) {
        const result = await db.query('SELECT * FROM git_triggers WHERE id = $1', [id]);
        return result.rows[0] ? new GitTriggerModel(result.rows[0]) : null;
    }

    async updateStatus(id, status) {
        const result = await db.query(
            `UPDATE git_triggers 
             SET status = $1, 
                 updated_at = NOW() 
             WHERE id = $2 
             RETURNING *`,
            [status, id]
        );
        return result.rows[0] ? new GitTriggerModel(result.rows[0]) : null;
    }

    async delete(id) {
        const result = await db.query('DELETE FROM git_triggers WHERE id = $1 RETURNING id', [id]);
        return result.rows.length > 0;
    }
}

module.exports = new GitTriggerRepository();
