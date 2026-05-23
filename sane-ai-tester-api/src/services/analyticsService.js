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

    async getTokenUsage(days = 7) {
        // 1. Daily totals by api_type
        const dailyResult = await db.query(`
            SELECT
                TO_CHAR(DATE(timestamp), 'YYYY-MM-DD') as date,
                api_type,
                SUM(tokens_used)      as total_tokens,
                SUM(prompt_tokens)    as prompt_tokens,
                SUM(completion_tokens) as completion_tokens
            FROM ai_api_usage
            WHERE timestamp > NOW() - CAST($1 || ' days' AS INTERVAL)
            GROUP BY DATE(timestamp), api_type
            ORDER BY date ASC
        `, [days]);

        // 2. Overall summary
        const summaryResult = await db.query(`
            SELECT
                api_type,
                COUNT(*)                          as call_count,
                SUM(tokens_used)                  as total_tokens,
                SUM(prompt_tokens)                as prompt_tokens,
                SUM(completion_tokens)            as completion_tokens,
                ROUND(AVG(request_duration))      as avg_duration_ms,
                COUNT(CASE WHEN success THEN 1 END) as success_count
            FROM ai_api_usage
            GROUP BY api_type
        `);

        // 3. Last 10 recent calls
        const recentResult = await db.query(`
            SELECT usage_id, api_type, tokens_used, prompt_tokens,
                   completion_tokens, request_duration, success, timestamp
            FROM ai_api_usage
            ORDER BY timestamp DESC
            LIMIT 10
        `);

        // Build date-keyed map for chart labels
        const dateMap = {};
        for (const row of dailyResult.rows) {
            if (!dateMap[row.date]) dateMap[row.date] = { openai: 0, ollama: 0 };
            dateMap[row.date][row.api_type] = parseInt(row.total_tokens || 0);
        }
        const labels = Object.keys(dateMap).sort();
        const openaiDaily  = labels.map(d => dateMap[d].openai  || 0);
        const ollamaDaily  = labels.map(d => dateMap[d].ollama  || 0);

        const summary = summaryResult.rows.map(r => ({
            api_type:         r.api_type,
            call_count:       parseInt(r.call_count || 0),
            total_tokens:     parseInt(r.total_tokens || 0),
            prompt_tokens:    parseInt(r.prompt_tokens || 0),
            completion_tokens:parseInt(r.completion_tokens || 0),
            avg_duration_ms:  parseInt(r.avg_duration_ms || 0),
            success_count:    parseInt(r.success_count || 0),
        }));

        const totals = summary.reduce((acc, s) => ({
            total_tokens:      acc.total_tokens      + s.total_tokens,
            prompt_tokens:     acc.prompt_tokens     + s.prompt_tokens,
            completion_tokens: acc.completion_tokens + s.completion_tokens,
            call_count:        acc.call_count        + s.call_count,
        }), { total_tokens: 0, prompt_tokens: 0, completion_tokens: 0, call_count: 0 });

        return {
            labels,
            openaiDaily,
            ollamaDaily,
            summary,
            totals,
            recent: recentResult.rows,
        };
    }

    async getDailyMetrics(days = 7) {
        // Query completed, failed and total task counts per day
        const result = await db.query(`
            SELECT 
                TO_CHAR(created_at, 'YYYY-MM-DD') as date,
                COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
                COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed,
                COUNT(*) as tasks
            FROM tasks
            WHERE created_at > NOW() - CAST($1 || ' days' AS INTERVAL)
            GROUP BY TO_CHAR(created_at, 'YYYY-MM-DD')
            ORDER BY date ASC
        `, [days]);

        // If no records in DB, construct list of last 'days' days with 0 tasks
        if (result.rows.length === 0) {
            const metrics = [];
            for (let i = days - 1; i >= 0; i--) {
                const date = new Date();
                date.setDate(date.getDate() - i);
                const dateStr = date.toISOString().split('T')[0];
                metrics.push({ date: dateStr, completed: 0, failed: 0, tasks: 0 });
            }
            return metrics;
        }

        return result.rows.map(r => ({
            date: r.date,
            completed: parseInt(r.completed || 0),
            failed: parseInt(r.failed || 0),
            tasks: parseInt(r.tasks || 0)
        }));
    }

    async getWorkerPerformance() {
        const result = await db.query(`
            SELECT 
                w.worker_id,
                w.nickname,
                w.status,
                COUNT(t.id) as total_tasks,
                COUNT(CASE WHEN t.status = 'completed' THEN 1 END) as completed_tasks,
                COUNT(CASE WHEN t.status = 'failed' THEN 1 END) as failed_tasks,
                CASE 
                    WHEN COUNT(t.id) > 0 THEN ROUND((COUNT(CASE WHEN t.status = 'completed' THEN 1 END) * 100.0 / COUNT(t.id))::numeric, 2)
                    ELSE 0 
                END as success_rate
            FROM worker_registry w
            LEFT JOIN tasks t ON w.worker_id = t.worker_id
            GROUP BY w.worker_id, w.nickname, w.status
        `);
        return result.rows.map(r => ({
            worker_id: r.worker_id,
            nickname: r.nickname,
            total_tasks: parseInt(r.total_tasks || 0),
            completed_tasks: parseInt(r.completed_tasks || 0),
            failed_tasks: parseInt(r.failed_tasks || 0),
            success_rate: parseFloat(r.success_rate || 0),
            status: r.status
        }));
    }
}

module.exports = new AnalyticsService();

