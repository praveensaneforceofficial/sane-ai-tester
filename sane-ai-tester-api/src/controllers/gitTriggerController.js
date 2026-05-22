const gitTriggerService = require('../services/gitTriggerService');

class GitTriggerController {
    async handleGitTrigger(req, res) {
        try {
            const { branch, repository, pr_number, commit_sha, author } = req.body;
            if (!branch || !repository || pr_number === undefined || !commit_sha || !author) {
                return res.status(400).json({ error: 'Missing required webhook trigger fields: branch, repository, pr_number, commit_sha, author' });
            }
            const trigger = await gitTriggerService.create({
                branch,
                repository,
                pr_number,
                commit_sha,
                author
            });
            res.status(201).json(trigger);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    async getAllTriggers(req, res) {
        try {
            const triggers = await gitTriggerService.getAll();
            res.json(triggers);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    async updateTriggerStatus(req, res) {
        try {
            const { id } = req.params;
            const { status } = req.body;
            if (!status) {
                return res.status(400).json({ error: 'Missing required field: status' });
            }
            const trigger = await gitTriggerService.updateStatus(id, status);
            res.json(trigger);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    async deleteTrigger(req, res) {
        try {
            const { id } = req.params;
            await gitTriggerService.delete(id);
            res.status(204).send();
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }
}

module.exports = new GitTriggerController();
