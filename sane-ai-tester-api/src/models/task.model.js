class TaskModel {
    constructor(data) {
        this.id = data.task_id || data.id;
        this.workerId = data.worker_id || data.workerId;
        this.prompt = data.prompt;
        this.url = data.url;
        this.priority = data.priority;
        this.status = data.status;
        this.resultData = data.result_data || data.resultData;
        this.createdAt = data.created_at || data.createdAt;
        this.completedAt = data.completed_at || data.completedAt;
    }

    isCompleted() {
        return this.status === 'completed' || this.status === 'failed';
    }

    toJSON() {
        return {
            id: this.id,
            task_id: this.id,
            worker_id: this.workerId,
            prompt: this.prompt,
            url: this.url,
            priority: this.priority,
            status: this.status,
            result_data: this.resultData,
            created_at: this.createdAt,
            completed_at: this.completedAt
        };
    }
}

module.exports = TaskModel;