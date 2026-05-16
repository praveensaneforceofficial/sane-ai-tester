const db = require('../config/database');
const ProjectModel = require('../models/project.model');

class ProjectRepository {
    async findAll() {
        const result = await db.query('SELECT * FROM zoho_projects ORDER BY project_name ASC');
        return result.rows.map(row => new ProjectModel(row));
    }

    async findById(projectJobjId) {
        const result = await db.query('SELECT * FROM zoho_projects WHERE project_jobj_id = $1', [projectJobjId]);
        return result.rows[0] ? new ProjectModel(result.rows[0]) : null;
    }

    async create(projectData) {
        const { project_jobj_id, project_name, category, test_type, mobile_platform, description, metadata } = projectData;
        const result = await db.query(
            `INSERT INTO zoho_projects 
             (project_jobj_id, project_name, category, test_type, mobile_platform, description, metadata, created_at, updated_at) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW()) 
             RETURNING *`,
            [project_jobj_id, project_name, category, test_type, mobile_platform, description, metadata]
        );
        return new ProjectModel(result.rows[0]);
    }

    async update(projectJobjId, projectData) {
        const { project_name, category, test_type, mobile_platform, description, active_flag, metadata } = projectData;
        const result = await db.query(
            `UPDATE zoho_projects 
             SET project_name = COALESCE($1, project_name), 
                 category = COALESCE($2, category), 
                 test_type = COALESCE($3, test_type),
                 mobile_platform = COALESCE($4, mobile_platform),
                 description = COALESCE($5, description),
                 active_flag = COALESCE($6, active_flag),
                 metadata = COALESCE($7, metadata),
                 updated_at = NOW() 
             WHERE project_jobj_id = $8 RETURNING *`,
            [project_name, category, test_type, mobile_platform, description, active_flag, metadata, projectJobjId]
        );
        return result.rows[0] ? new ProjectModel(result.rows[0]) : null;
    }

    async delete(projectJobjId) {
        const result = await db.query('DELETE FROM zoho_projects WHERE project_jobj_id = $1 RETURNING project_jobj_id', [projectJobjId]);
        return result.rows.length > 0;
    }

    async findByCategory(category) {
        const result = await db.query('SELECT * FROM zoho_projects WHERE category = $1 ORDER BY project_name ASC', [category]);
        return result.rows.map(row => new ProjectModel(row));
    }

    async findActive() {
        const result = await db.query('SELECT * FROM zoho_projects WHERE active_flag = TRUE ORDER BY project_name ASC');
        return result.rows.map(row => new ProjectModel(row));
    }

    async updateSyncTime(projectJobjId) {
        await db.query('UPDATE zoho_projects SET last_synced_at = NOW() WHERE project_jobj_id = $1', [projectJobjId]);
    }
}

module.exports = new ProjectRepository();
