const projectService = require('../services/projectService');

class ProjectController {
    async getAllProjects(req, res) {
        try {
            const projects = await projectService.getAll();
            res.json(projects);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    async getProjectById(req, res) {
        try {
            const project = await projectService.getById(req.params.projectJobjId);
            res.json(project);
        } catch (err) {
            res.status(404).json({ error: err.message });
        }
    }

    async createProject(req, res) {
        try {
            const project = await projectService.create(req.body);
            res.status(201).json(project);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    async updateProject(req, res) {
        try {
            const result = await projectService.update(req.params.projectJobjId, req.body);
            res.json(result);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    async deleteProject(req, res) {
        try {
            await projectService.delete(req.params.projectJobjId);
            res.status(204).send();
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    async getProjectsByCategory(req, res) {
        try {
            const projects = await projectService.getByCategory(req.params.category);
            res.json(projects);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    async getActiveProjects(req, res) {
        try {
            const projects = await projectService.getActive();
            res.json(projects);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    async syncZohoProjects(req, res) {
        try {
            const result = await projectService.syncZoho();
            res.json(result);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }
}

module.exports = new ProjectController();
