const reportService = require('../services/reportService');

class ReportController {
    async getAllReports(req, res) {
        try {
            const reports = await reportService.getAll();
            res.json(reports);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    async getReportById(req, res) {
        try {
            const report = await reportService.getById(req.params.reportId);
            res.json(report);
        } catch (err) {
            res.status(404).json({ error: err.message });
        }
    }

    async generateReport(req, res) {
        try {
            const report = await reportService.generate(req.body);
            res.status(201).json(report);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    async getReportByTask(req, res) {
        try {
            const report = await reportService.getByTask(req.params.taskId);
            res.json(report);
        } catch (err) {
            res.status(404).json({ error: err.message });
        }
    }

    async getReportsByWorker(req, res) {
        try {
            const reports = await reportService.getByWorker(req.params.workerId);
            res.json(reports);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    async getReportsByProject(req, res) {
        try {
            const reports = await reportService.getByProject(req.params.projectName);
            res.json(reports);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    async deleteReport(req, res) {
        try {
            await reportService.delete(req.params.reportId);
            res.status(204).send();
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    async downloadReport(req, res) {
        try {
            const result = await reportService.download(req.params.reportId);
            res.json(result);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    async getTestSummary(req, res) {
        try {
            const { project_name, start_date, end_date } = req.query;
            const summary = await reportService.getTestSummary(project_name, start_date, end_date);
            res.json(summary);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    async getFailedTests(req, res) {
        try {
            const limit = parseInt(req.query.limit || 50);
            const failedTests = await reportService.getFailedTests(limit);
            res.json(failedTests);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    async exportReport(req, res) {
        try {
            const result = await reportService.exportReport(req.body);
            res.json(result);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }
}

module.exports = new ReportController();

