class ErrorLogModel {
    constructor(data) {
        this.id = data.id;
        this.errorId = data.error_id;
        this.taskId = data.task_id;
        this.workerId = data.worker_id;
        this.errorType = data.error_type;
        this.errorMessage = data.error_message;
        this.stackTrace = data.stack_trace;
        this.screenshotPath = data.screenshot_path;
        this.videoPath = data.video_path;
        this.severity = data.severity;
        this.aiAnalysis = data.ai_analysis;
        this.resolved = data.resolved;
        this.resolvedAt = data.resolved_at;
        this.createdAt = data.created_at;
    }

    toJSON() {
        return {
            id: this.id,
            error_id: this.errorId,
            task_id: this.taskId,
            worker_id: this.workerId,
            error_type: this.errorType,
            error_message: this.errorMessage,
            stack_trace: this.stackTrace,
            screenshot_path: this.screenshotPath,
            video_path: this.videoPath,
            severity: this.severity,
            ai_analysis: this.aiAnalysis,
            resolved: this.resolved,
            resolved_at: this.resolvedAt,
            created_at: this.createdAt
        };
    }
}

module.exports = ErrorLogModel;
