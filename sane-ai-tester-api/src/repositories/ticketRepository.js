const db = require('../config/database');
const TicketModel = require('../models/ticket.model');
const TicketCommentModel = require('../models/ticketComment.model');

class TicketRepository {
    async findAll() {
        const result = await db.query('SELECT * FROM zoho_tickets ORDER BY created_at DESC');
        return result.rows.map(row => new TicketModel(row));
    }

    async findById(ticketId) {
        const result = await db.query('SELECT * FROM zoho_tickets WHERE ticket_id = $1', [ticketId]);
        return result.rows[0] ? new TicketModel(result.rows[0]) : null;
    }

    async create(ticketData) {
        const { ticket_id, project_jobj_id, title, description, status, priority, severity, ticket_type, assigned_to, reporter, custom_fields, zoho_data } = ticketData;
        const result = await db.query(
            `INSERT INTO zoho_tickets 
             (ticket_id, project_jobj_id, title, description, status, priority, severity, ticket_type, assigned_to, reporter, custom_fields, zoho_data, created_at, updated_at) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW()) 
             RETURNING *`,
            [ticket_id, project_jobj_id, title, description, status, priority, severity, ticket_type, assigned_to, reporter, custom_fields, zoho_data]
        );
        return new TicketModel(result.rows[0]);
    }

    async update(ticketId, ticketData) {
        const { title, description, status, priority, severity, assigned_to, is_ai_testing, ai_testing_status, task_id, custom_fields } = ticketData;
        const result = await db.query(
            `UPDATE zoho_tickets 
             SET title = COALESCE($1, title), 
                 description = COALESCE($2, description), 
                 status = COALESCE($3, status),
                 priority = COALESCE($4, priority),
                 severity = COALESCE($5, severity),
                 assigned_to = COALESCE($6, assigned_to),
                 is_ai_testing = COALESCE($7, is_ai_testing),
                 ai_testing_status = COALESCE($8, ai_testing_status),
                 task_id = COALESCE($9, task_id),
                 custom_fields = COALESCE($10, custom_fields),
                 updated_at = NOW() 
             WHERE ticket_id = $11 RETURNING *`,
            [title, description, status, priority, severity, assigned_to, is_ai_testing, ai_testing_status, task_id, custom_fields, ticketId]
        );
        return result.rows[0] ? new TicketModel(result.rows[0]) : null;
    }

    async findByProject(projectJobjId) {
        const result = await db.query('SELECT * FROM zoho_tickets WHERE project_jobj_id = $1 ORDER BY created_at DESC', [projectJobjId]);
        return result.rows.map(row => new TicketModel(row));
    }

    async findAiTesting() {
        const result = await db.query("SELECT * FROM zoho_tickets WHERE is_ai_testing = TRUE ORDER BY created_at DESC");
        return result.rows.map(row => new TicketModel(row));
    }

    async createComment(commentData) {
        const { comment_id, ticket_id, commenter_type, commenter_name, comment_text, is_ai_generated, metadata } = commentData;
        const result = await db.query(
            `INSERT INTO ticket_comments 
             (comment_id, ticket_id, commenter_type, commenter_name, comment_text, is_ai_generated, metadata, created_at) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, NOW()) 
             RETURNING *`,
            [comment_id, ticket_id, commenter_type, commenter_name, comment_text, is_ai_generated, metadata]
        );
        
        // Update comment count in ticket
        await db.query('UPDATE zoho_tickets SET comments_count = comments_count + 1 WHERE ticket_id = $1', [ticket_id]);
        
        return new TicketCommentModel(result.rows[0]);
    }

    async findCommentsByTicket(ticketId) {
        const result = await db.query('SELECT * FROM ticket_comments WHERE ticket_id = $1 ORDER BY created_at ASC', [ticketId]);
        return result.rows.map(row => new TicketCommentModel(row));
    }
}

module.exports = new TicketRepository();
