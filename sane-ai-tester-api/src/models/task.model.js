class TaskModel {
    constructor(data) {
        this.id = data.id;
        this.workerId = data.worker_id;
        this.prompt = data.prompt;
        this.status = data.status;
        this.resultData = data.result_data;
        this.createdAt = data.created_at;
        this.completedAt = data.completed_at;
    }

    isCompleted() {
        return this.status === 'completed' || this.status === 'failed';
    }

    toJSON() {
        return {
            id: this.id,
            worker_id: this.workerId,
            prompt: this.prompt,
            status: this.status,
            result_data: this.resultData,
            created_at: this.createdAt,
            completed_at: this.completedAt
        };
    }
}

module.exports = TaskModel;