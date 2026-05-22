class GitTriggerModel {
    constructor(data) {
        this.id = data.id;
        this.branch = data.branch;
        this.repository = data.repository;
        this.prNumber = data.pr_number || data.prNumber;
        this.commitSha = data.commit_sha || data.commitSha;
        this.author = data.author;
        this.description = data.description;
        this.comment = data.comment;
        this.action = data.action;
        this.status = data.status;
        this.createdAt = data.created_at || data.createdAt;
        this.updatedAt = data.updated_at || data.updatedAt;
    }

    toJSON() {
        return {
            id: this.id,
            branch: this.branch,
            repository: this.repository,
            pr_number: this.prNumber,
            commit_sha: this.commitSha,
            author: this.author,
            description: this.description,
            comment: this.comment,
            action: this.action,
            status: this.status,
            created_at: this.createdAt,
            updated_at: this.updatedAt
        };
    }
}

module.exports = GitTriggerModel;
