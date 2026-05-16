class TicketCommentModel {
    constructor(data) {
        this.id = data.id;
        this.commentId = data.comment_id;
        this.ticketId = data.ticket_id;
        this.commenterType = data.commenter_type;
        this.commenterName = data.commenter_name;
        this.commentText = data.comment_text;
        this.isAiGenerated = data.is_ai_generated;
        this.aiModelUsed = data.ai_model_used;
        this.tokensUsed = data.tokens_used;
        this.responseTime = data.response_time;
        this.parentCommentId = data.parent_comment_id;
        this.metadata = data.metadata;
        this.createdAt = data.created_at;
    }

    toJSON() {
        return {
            id: this.id,
            comment_id: this.commentId,
            ticket_id: this.ticketId,
            commenter_type: this.commenterType,
            commenter_name: this.commenterName,
            comment_text: this.commentText,
            is_ai_generated: this.isAiGenerated,
            ai_model_used: this.aiModelUsed,
            tokens_used: this.tokensUsed,
            response_time: this.responseTime,
            parent_comment_id: this.parentCommentId,
            metadata: this.metadata,
            created_at: this.createdAt
        };
    }
}

module.exports = TicketCommentModel;
