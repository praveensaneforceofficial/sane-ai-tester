class ProjectModel {
    constructor(data) {
        this.id = data.id;
        this.projectJobjId = data.project_jobj_id;
        this.projectName = data.project_name;
        this.category = data.category;
        this.testType = data.test_type;
        this.mobilePlatform = data.mobile_platform;
        this.description = data.description;
        this.createdDate = data.created_date;
        this.activeFlag = data.active_flag;
        this.lastSyncedAt = data.last_synced_at;
        this.metadata = data.metadata;
        this.createdAt = data.created_at;
        this.updatedAt = data.updated_at;
    }

    toJSON() {
        return {
            id: this.id,
            project_jobj_id: this.projectJobjId,
            project_name: this.projectName,
            category: this.category,
            test_type: this.testType,
            mobile_platform: this.mobilePlatform,
            description: this.description,
            created_date: this.createdDate,
            active_flag: this.activeFlag,
            last_synced_at: this.lastSyncedAt,
            metadata: this.metadata,
            created_at: this.createdAt,
            updated_at: this.updatedAt
        };
    }
}

module.exports = ProjectModel;
