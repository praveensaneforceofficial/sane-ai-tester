const reportRepository = require('../repositories/reportRepository');
const db = require('../config/database');
const fs = require('fs');
const path = require('path');

class ReportService {
    async getAll() {
        const reports = await reportRepository.findAll();
        return reports.map(r => r.toJSON());
    }

    async getById(reportId) {
        const report = await reportRepository.findById(reportId);
        if (!report) throw new Error('Report not found');
        return report.toJSON();
    }

    async generate(reportData) {
        if (!reportData.report_id) {
            reportData.report_id = `rep-${Date.now()}`;
        }
        const report = await reportRepository.create(reportData);
        return report.toJSON();
    }

    async getByTask(taskId) {
        const report = await reportRepository.findByTask(taskId);
        if (!report) throw new Error('Report not found for this task');
        return report.toJSON();
    }

    async getByWorker(workerId) {
        const reports = await reportRepository.findByWorker(workerId);
        return reports.map(r => r.toJSON());
    }

    async getByProject(projectName) {
        const reports = await reportRepository.findByProject(projectName);
        return reports.map(r => r.toJSON());
    }

    async delete(reportId) {
        const deleted = await reportRepository.delete(reportId);
        if (!deleted) throw new Error('Report not found');
        return true;
    }

    async download(reportId) {
        const report = await reportRepository.findById(reportId);
        if (!report) throw new Error('Report not found');
        // In a real scenario, this would return a file path or stream
        return { file_path: report.videoPath || 'no-file-available' };
    }

    async getTestSummary(projectName, startDate, endDate) {
        const summaryResult = await db.query(`
            SELECT 
                COUNT(id) as total_reports,
                COALESCE(SUM(total_tests), 0) as total_tests,
                COALESCE(SUM(passed_tests), 0) as passed,
                COALESCE(SUM(failed_tests), 0) as failed,
                COALESCE(SUM(skipped_tests), 0) as skipped,
                CASE 
                    WHEN SUM(total_tests) > 0 THEN ROUND((SUM(passed_tests) * 100.0 / SUM(total_tests))::numeric, 2)
                    ELSE 0 
                END as pass_rate
            FROM test_reports
            WHERE 
                ($1::text IS NULL OR project_name = $1)
                AND ($2::timestamp IS NULL OR generated_at >= $2)
                AND ($3::timestamp IS NULL OR generated_at <= $3)
        `, [projectName || null, startDate || null, endDate || null]);

        const summary = summaryResult.rows[0];

        const failedResult = await db.query(`
            SELECT 
                report_id as id,
                task_id,
                worker_id,
                project_name,
                summary,
                total_tests,
                passed_tests as passed,
                failed_tests as failed,
                generated_at as timestamp
            FROM test_reports
            WHERE 
                failed_tests > 0
                AND ($1::text IS NULL OR project_name = $1)
                AND ($2::timestamp IS NULL OR generated_at >= $2)
                AND ($3::timestamp IS NULL OR generated_at <= $3)
            ORDER BY generated_at DESC
            LIMIT 20
        `, [projectName || null, startDate || null, endDate || null]);

        return {
            report_id: `RPT_${Date.now()}`,
            timestamp: new Date().toISOString(),
            total_tests: parseInt(summary.total_tests),
            passed: parseInt(summary.passed),
            failed: parseInt(summary.failed),
            skipped: parseInt(summary.skipped),
            pass_rate: parseFloat(summary.pass_rate),
            summary: `Report generated for ${projectName || 'All Projects'}. ${summary.passed} passed, ${summary.failed} failed.`,
            failed_tests: failedResult.rows.map(r => ({
                id: r.id,
                task_id: r.task_id,
                worker_id: r.worker_id,
                project_name: r.project_name,
                summary: r.summary,
                total_tests: parseInt(r.total_tests),
                passed: parseInt(r.passed),
                failed: parseInt(r.failed),
                timestamp: r.timestamp ? r.timestamp.toISOString() : null
            }))
        };
    }

    async getFailedTests(limit = 50) {
        const result = await db.query(`
            SELECT 
                r.report_id as id,
                r.task_id,
                w.nickname as worker,
                t.prompt,
                r.summary as error,
                r.generated_at as timestamp
            FROM test_reports r
            LEFT JOIN worker_registry w ON r.worker_id = w.worker_id
            LEFT JOIN tasks t ON r.task_id = t.task_id
            WHERE r.failed_tests > 0
            ORDER BY r.generated_at DESC
            LIMIT $1
        `, [limit]);

        return result.rows.map(r => ({
            id: r.id,
            task_id: r.task_id,
            worker: r.worker || 'Unknown',
            prompt: r.prompt || 'No Prompt',
            error: r.error || 'Unknown Error',
            timestamp: r.timestamp ? r.timestamp.toISOString() : null
        }));
    }

    async exportReport(reportData) {
        const reportsDir = path.join(__dirname, '../../reports');
        if (!fs.existsSync(reportsDir)) {
            fs.mkdirSync(reportsDir, { recursive: true });
        }
        
        const filename = `report_${new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14)}.json`;
        const filepath = path.join(reportsDir, filename);
        
        fs.writeFileSync(filepath, JSON.stringify(reportData, null, 2));
        
        return {
            file_path: filepath,
            message: "Report exported successfully"
        };
    }
}

module.exports = new ReportService();

