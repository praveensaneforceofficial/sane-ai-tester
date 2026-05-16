const ticketService = require('../services/ticketService');

class TicketController {
    async getAllTickets(req, res) {
        try {
            const tickets = await ticketService.getAll();
            res.json(tickets);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    async getTicketById(req, res) {
        try {
            const ticket = await ticketService.getById(req.params.ticketId);
            res.json(ticket);
        } catch (err) {
            res.status(404).json({ error: err.message });
        }
    }

    async createTicket(req, res) {
        try {
            const ticket = await ticketService.create(req.body);
            res.status(201).json(ticket);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    async updateTicket(req, res) {
        try {
            const result = await ticketService.update(req.params.ticketId, req.body);
            res.json(result);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    async updateAiTestingStatus(req, res) {
        try {
            const result = await ticketService.updateAiStatus(req.params.ticketId, req.body);
            res.json(result);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    async getTicketsByProject(req, res) {
        try {
            const tickets = await ticketService.getByProject(req.params.projectJobjId);
            res.json(tickets);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    async getAiTestingTickets(req, res) {
        try {
            const tickets = await ticketService.getAiTesting();
            res.json(tickets);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    async addComment(req, res) {
        try {
            const comment = await ticketService.addComment(req.params.ticketId, req.body);
            res.status(201).json(comment);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    async getTicketComments(req, res) {
        try {
            const comments = await ticketService.getComments(req.params.ticketId);
            res.json(comments);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }
}

module.exports = new TicketController();
