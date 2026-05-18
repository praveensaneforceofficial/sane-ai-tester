const db = require('../config/database');
const ReportModel = require('../models/report.model');

class ReportRepository {
    async findAll() {
        const result = await db.query('SELECT * FROM test_reports ORDER BY generated_at DESC');
        return result.rows.map(row => new ReportModel(row));
    }

    async findById(reportId) {
        const result = await db.query('SELECT * FROM test_reports WHERE report_id = $1', [reportId]);
        return result.rows[0] ? new ReportModel(result.rows[0]) : null;
    }

    async create(reportData) {
        const { report_id, task_id, worker_id, project_name, total_tests, passed_tests, failed_tests, skipped_tests, success_rate, duration, summary, report_data, video_path, screenshots } = reportData;
        const result = await db.query(
            `INSERT INTO test_reports 
             (report_id, task_id, worker_id, project_name, total_tests, passed_tests, failed_tests, skipped_tests, success_rate, duration, summary, report_data, video_path, screenshots, generated_at) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW()) 
             RETURNING *`,
            [report_id, task_id, worker_id, project_name, total_tests, passed_tests, failed_tests, skipped_tests, success_rate, duration, summary, report_data, video_path, screenshots]
        );
        return new ReportModel(result.rows[0]);
    }

    async findByTask(taskId) {
        let result;
        if (taskId.startsWith('CT-')) {
            const timestamp = taskId.replace('CT-', '');
            result = await db.query('SELECT * FROM test_reports WHERE task_id LIKE $1 ORDER BY generated_at DESC', [`%${timestamp}%`]);
        } else {
            result = await db.query('SELECT * FROM test_reports WHERE task_id = $1', [taskId]);
        }
        return result.rows[0] ? new ReportModel(result.rows[0]) : null;
    }

    async findByWorker(workerId) {
        const result = await db.query('SELECT * FROM test_reports WHERE worker_id = $1 ORDER BY generated_at DESC', [workerId]);
        return result.rows.map(row => new ReportModel(row));
    }

    async findByProject(projectName) {
        const result = await db.query('SELECT * FROM test_reports WHERE project_name = $1 ORDER BY generated_at DESC', [projectName]);
        return result.rows.map(row => new ReportModel(row));
    }

    async delete(reportId) {
        const result = await db.query('DELETE FROM test_reports WHERE report_id = $1 RETURNING report_id', [reportId]);
        return result.rows.length > 0;
    }
}

module.exports = new ReportRepository();
