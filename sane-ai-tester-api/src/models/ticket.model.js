class TicketModel {
    constructor(data) {
        this.id = data.id;
        this.ticketId = data.ticket_id;
        this.projectJobjId = data.project_jobj_id;
        this.sprintId = data.sprint_id;
        this.title = data.title;
        this.description = data.description;
        this.status = data.status;
        this.priority = data.priority;
        this.severity = data.severity;
        this.ticketType = data.ticket_type;
        this.assignedTo = data.assigned_to;
        this.reporter = data.reporter;
        this.commentsCount = data.comments_count;
        this.attachmentsCount = data.attachments_count;
        this.isAiTesting = data.is_ai_testing;
        this.aiTestingStatus = data.ai_testing_status;
        this.taskId = data.task_id;
        this.customFields = data.custom_fields;
        this.zohoData = data.zoho_data;
        this.createdTime = data.created_time;
        this.modifiedTime = data.modified_time;
        this.closedTime = data.closed_time;
        this.syncedAt = data.synced_at;
        this.createdAt = data.created_at;
        this.updatedAt = data.updated_at;
    }

    toJSON() {
        return {
            id: this.id,
            ticket_id: this.ticketId,
            project_jobj_id: this.projectJobjId,
            sprint_id: this.sprintId,
            title: this.title,
            description: this.description,
            status: this.status,
            priority: this.priority,
            severity: this.severity,
            ticket_type: this.ticketType,
            assigned_to: this.assignedTo,
            reporter: this.reporter,
            comments_count: this.commentsCount,
            attachments_count: this.attachmentsCount,
            is_ai_testing: this.isAiTesting,
            ai_testing_status: this.aiTestingStatus,
            task_id: this.taskId,
            custom_fields: this.customFields,
            zoho_data: this.zohoData,
            created_time: this.createdTime,
            modified_time: this.modifiedTime,
            closed_time: this.closedTime,
            synced_at: this.syncedAt,
            created_at: this.createdAt,
            updated_at: this.updatedAt
        };
    }
}

module.exports = TicketModel;
