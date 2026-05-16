const db = require('../config/database');

class AnalyticsService {
    async getDashboard() {
        const result = await db.query(`
            SELECT 
                (SELECT COUNT(*) FROM worker_registry WHERE status = 'online') as active_workers,
                (SELECT COUNT(*) FROM tasks WHERE status = 'pending') as pending_tasks,
                (SELECT COUNT(*) FROM tasks WHERE status = 'in_progress') as running_tasks,
                (SELECT COUNT(*) FROM error_logs WHERE resolved = FALSE) as unresolved_errors,
                (SELECT SUM(tokens_used) FROM ai_api_usage WHERE timestamp > NOW() - INTERVAL '24 hours') as tokens_last_24h
        `);
        return result.rows[0];
    }

    async getWorkerStats() {
        const result = await db.query(`
            SELECT 
                w.nickname,
                w.worker_id,
                COUNT(t.id) as total_tasks,
                COUNT(CASE WHEN t.status = 'completed' THEN 1 END) as completed_tasks,
                COUNT(CASE WHEN t.status = 'failed' THEN 1 END) as failed_tasks
            FROM worker_registry w
            LEFT JOIN tasks t ON w.worker_id = t.worker_id
            GROUP BY w.worker_id, w.nickname
        `);
        return result.rows;
    }

    async getTaskStats() {
        const result = await db.query(`
            SELECT 
                status,
                COUNT(*) as count,
                AVG(duration) as avg_duration
            FROM tasks
            GROUP BY status
        `);
        return result.rows;
    }

    async getErrorStats() {
        const result = await db.query(`
            SELECT 
                severity,
                COUNT(*) as count,
                COUNT(CASE WHEN resolved = TRUE THEN 1 END) as resolved_count
            FROM error_logs
            GROUP BY severity
        `);
        return result.rows;
    }

    async getSuccessRate() {
        const result = await db.query(`
            SELECT 
                DATE(created_at) as date,
                COUNT(*) as total,
                COUNT(CASE WHEN status = 'completed' THEN 1 END) * 100.0 / COUNT(*) as success_rate
            FROM tasks
            WHERE created_at > NOW() - INTERVAL '7 days'
            GROUP BY DATE(created_at)
            ORDER BY date ASC
        `);
        return result.rows;
    }

    async getProjectStats() {
        const result = await db.query(`
            SELECT 
                p.project_name,
                COUNT(t.id) as total_tickets,
                COUNT(CASE WHEN t.status = 'Closed' THEN 1 END) as closed_tickets,
                COUNT(CASE WHEN t.is_ai_testing = TRUE THEN 1 END) as ai_tested_tickets
            FROM zoho_projects p
            LEFT JOIN zoho_tickets t ON p.project_jobj_id = t.project_jobj_id
            GROUP BY p.project_name
        `);
        return result.rows;
    }
}

module.exports = new AnalyticsService();
