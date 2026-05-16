const ticketRepository = require('../repositories/ticketRepository');

class TicketService {
    async getAll() {
        const tickets = await ticketRepository.findAll();
        return tickets.map(t => t.toJSON());
    }

    async getById(ticketId) {
        const ticket = await ticketRepository.findById(ticketId);
        if (!ticket) throw new Error('Ticket not found');
        return ticket.toJSON();
    }

    async create(ticketData) {
        const ticket = await ticketRepository.create(ticketData);
        return ticket.toJSON();
    }

    async update(ticketId, ticketData) {
        const ticket = await ticketRepository.update(ticketId, ticketData);
        if (!ticket) throw new Error('Ticket not found');
        return ticket.toJSON();
    }

    async updateAiStatus(ticketId, aiStatusData) {
        const { status, task_id } = aiStatusData;
        const ticket = await ticketRepository.update(ticketId, { 
            ai_testing_status: status, 
            task_id,
            is_ai_testing: true
        });
        if (!ticket) throw new Error('Ticket not found');
        return ticket.toJSON();
    }

    async getByProject(projectJobjId) {
        const tickets = await ticketRepository.findByProject(projectJobjId);
        return tickets.map(t => t.toJSON());
    }

    async getAiTesting() {
        const tickets = await ticketRepository.findAiTesting();
        return tickets.map(t => t.toJSON());
    }

    async addComment(ticketId, commentData) {
        if (!commentData.comment_id) {
            commentData.comment_id = `comment-${Date.now()}`;
        }
        commentData.ticket_id = ticketId;
        const comment = await ticketRepository.createComment(commentData);
        return comment.toJSON();
    }

    async getComments(ticketId) {
        const comments = await ticketRepository.findCommentsByTicket(ticketId);
        return comments.map(c => c.toJSON());
    }
}

module.exports = new TicketService();
