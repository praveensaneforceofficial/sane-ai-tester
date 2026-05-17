const projectRepository = require('../repositories/projectRepository');

class ProjectService {
    async getAll() {
        const projects = await projectRepository.findAll();
        return projects.map(p => p.toJSON());
    }

    async getById(projectJobjId) {
        const project = await projectRepository.findById(projectJobjId);
        if (!project) throw new Error('Project not found');
        return project.toJSON();
    }

    async create(projectData) {
        const project = await projectRepository.create(projectData);
        return project.toJSON();
    }

    async update(projectJobjId, projectData) {
        const project = await projectRepository.update(projectJobjId, projectData);
        if (!project) throw new Error('Project not found');
        return project.toJSON();
    }

    async delete(projectJobjId) {
        const deleted = await projectRepository.delete(projectJobjId);
        if (!deleted) throw new Error('Project not found');
        return true;
    }

    async getByCategory(category) {
        const projects = await projectRepository.findByCategory(category);
        return projects.map(p => p.toJSON());
    }

    async getActive() {
        const projects = await projectRepository.findActive();
        return projects.map(p => p.toJSON());
    }

    async getSprints(projectId) {
        // Delegates to scraper for sprint list
        const scraper = require('../services/zohoSprintScraper');
        return await scraper.fetchSprints(projectId);
    }

    async getSprintItems(projectId, sprintId, laneId = null) {
        const scraper = require('../services/zohoSprintScraper');
        const project = await projectRepository.findById(projectId);
        const boardNumber = project ? project.boardId : null;
        return await scraper.fetchSprintItems(projectId, sprintId, laneId, boardNumber);
    }

    // Sync Zoho projects using the scraper
    async syncZoho() {
        const zohoSprintScraper = require('./zohoSprintScraper');
        console.log('Syncing Zoho Projects via Scraper...');
        const result = await zohoSprintScraper.scrapeProjects();
        return result;
    }
}
module.exports = new ProjectService();
