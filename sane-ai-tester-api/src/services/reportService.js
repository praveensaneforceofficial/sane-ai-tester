const reportRepository = require('../repositories/reportRepository');

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
}

module.exports = new ReportService();
