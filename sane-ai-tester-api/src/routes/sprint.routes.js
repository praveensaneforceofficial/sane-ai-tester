const express = require('express');
const router = express.Router();

// Service layer handling Zoho sprint data
const projectService = require('../services/projectService');

/**
 * GET /api/sprints/:projectId
 * Returns list of active sprints for a Zoho project.
 */
router.get('/sprints/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;
    const result = await projectService.getSprints(projectId);
    res.json({ success: true, sprints: result.sprints || [] });
  } catch (err) {
    console.error('Error fetching sprints', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/sprints/:projectId/:sprintId/items
 * Returns items (cards) for a specific sprint.
 */
router.get('/sprints/:projectId/:sprintId/items', async (req, res) => {
  try {
    const { projectId, sprintId } = req.params;
    const { laneId } = req.query; // optional lane filter
    const items = await projectService.getSprintItems(projectId, sprintId, laneId);
    res.json({ success: true, items });
  } catch (err) {
    console.error('Error fetching sprint items', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/sprints/:projectId/:sprintId/board-url
 * Returns the direct Zoho board URL for a sprint.
 * URL pattern: https://sprints.zoho.in/workspace/sanmedia#P{projectIdx}/board/SP{ sprintIdx }
 */
router.get('/sprints/:projectId/:sprintId/board-url', async (req, res) => {
  try {
    const { projectId, sprintId } = req.params;
    // Compute indices via the service (which re‑fetches the sprint list)
    const sprintData = await projectService.getSprints(projectId);
    const sprintIdx = (sprintData.sprints || []).findIndex(s => s.id === sprintId) + 1; // 1‑based
    // Project index – we need the order of the project within the user's Zoho project list.
    const allProjects = await projectService.getByCategory('zohosprint');
    const projectIdx = allProjects.findIndex(p => p.project_jobj_id === projectId) + 1 || 1;
    const boardUrl = `https://sprints.zoho.in/workspace/sanmedia#P${projectIdx}/board/SP${sprintIdx || 1}`;
    res.json({ success: true, url: boardUrl });
  } catch (err) {
    console.error('Error building board URL', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = { router };
