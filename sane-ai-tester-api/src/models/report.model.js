class ReportModel {
    constructor(data) {
        this.id = data.id;
        this.reportId = data.report_id;
        this.taskId = data.task_id;
        this.workerId = data.worker_id;
        this.projectName = data.project_name;
        this.totalTests = data.total_tests;
        this.passedTests = data.passed_tests;
        this.failedTests = data.failed_tests;
        this.skippedTests = data.skipped_tests;
        this.successRate = data.success_rate;
        this.duration = data.duration;
        this.summary = data.summary;
        this.reportData = data.report_data;
        this.videoPath = data.video_path;
        this.screenshots = data.screenshots;
        this.generatedAt = data.generated_at;
    }

    toJSON() {
        return {
            id: this.id,
            report_id: this.reportId,
            task_id: this.taskId,
            worker_id: this.workerId,
            project_name: this.projectName,
            total_tests: this.totalTests,
            passed_tests: this.passedTests,
            failed_tests: this.failedTests,
            skipped_tests: this.skippedTests,
            success_rate: this.successRate,
            duration: this.duration,
            summary: this.summary,
            report_data: this.reportData,
            video_path: this.videoPath,
            screenshots: this.screenshots,
            generated_at: this.generatedAt
        };
    }
}

module.exports = ReportModel;
