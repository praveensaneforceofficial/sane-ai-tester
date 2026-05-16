const workerService = require('../services/workerService');

class WorkerController {
    async getAllWorkers(req, res) {
        try {
            const workers = await workerService.getAllWorkers();
            res.json(workers);
        } catch (err) {
            console.error('Error fetching workers:', err);
            res.status(500).json({ error: err.message });
        }
    }

    async getWorkerById(req, res) {
        try {
            const worker = await workerService.getWorkerById(req.params.workerId);
            res.json(worker);
        } catch (err) {
            if (err.message === 'Worker not found') {
                res.status(404).json({ error: err.message });
            } else {
                res.status(500).json({ error: err.message });
            }
        }
    }

    async updateWorkerStatus(req, res) {
        try {
            const { workerId } = req.params;
            const { action } = req.body;
            const result = await workerService.updateWorkerStatus(workerId, action);
            res.json(result);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }
}

module.exports = new WorkerController();