const gitTriggerService = require('../services/gitTriggerService');
const db = require('../config/database');

class GitTriggerController {
    async handleGitTrigger(req, res) {
        if (!db.isConnected()) {
            return res.status(503).json({ error: 'Database not available. Please try again shortly.' });
        }
        try {
            const { branch, repository, pr_number, commit_sha, author, description, comment, action } = req.body;
            if (!branch || !repository || pr_number === undefined || !commit_sha || !author) {
                return res.status(400).json({ error: 'Missing required webhook trigger fields: branch, repository, pr_number, commit_sha, author' });
            }
            const trigger = await gitTriggerService.create({
                branch,
                repository,
                pr_number,
                commit_sha,
                author,
                description,
                comment,
                action
            });
            res.status(201).json(trigger);
        } catch (err) {
            console.error('❌ handleGitTrigger error:', err.message);
            res.status(500).json({ error: err.message });
        }
    }

    async getAllTriggers(req, res) {
        if (!db.isConnected()) {
            return res.status(503).json({ error: 'Database not available. Please try again shortly.' });
        }
        try {
            const triggers = await gitTriggerService.getAll();
            res.json(triggers);
        } catch (err) {
            console.error('❌ getAllTriggers error:', err.message);
            res.status(500).json({ error: err.message });
        }
    }

    async updateTriggerStatus(req, res) {
        if (!db.isConnected()) {
            return res.status(503).json({ error: 'Database not available. Please try again shortly.' });
        }
        try {
            const { id } = req.params;
            const { status } = req.body;
            if (!status) {
                return res.status(400).json({ error: 'Missing required field: status' });
            }
            const trigger = await gitTriggerService.updateStatus(id, status);
            res.json(trigger);
        } catch (err) {
            console.error('❌ updateTriggerStatus error:', err.message);
            res.status(500).json({ error: err.message });
        }
    }

    async deleteTrigger(req, res) {
        if (!db.isConnected()) {
            return res.status(503).json({ error: 'Database not available. Please try again shortly.' });
        }
        try {
            const { id } = req.params;
            await gitTriggerService.delete(id);
            res.status(204).send();
        } catch (err) {
            console.error('❌ deleteTrigger error:', err.message);
            res.status(500).json({ error: err.message });
        }
    }
}

module.exports = new GitTriggerController();
