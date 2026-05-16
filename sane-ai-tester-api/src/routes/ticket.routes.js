const express = require('express');
const router = express.Router();
const ticketController = require('../controllers/ticketController');

router.get('/', ticketController.getAllTickets);
router.post('/', ticketController.createTicket);
router.get('/ai-testing', ticketController.getAiTestingTickets);
router.get('/project/:projectJobjId', ticketController.getTicketsByProject);
router.get('/:ticketId', ticketController.getTicketById);
router.put('/:ticketId', ticketController.updateTicket);
router.put('/:ticketId/ai-status', ticketController.updateAiTestingStatus);
router.get('/:ticketId/comments', ticketController.getTicketComments);
router.post('/:ticketId/comments', ticketController.addComment);

module.exports = router;
