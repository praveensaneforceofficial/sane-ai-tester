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
    
    // 1. Fetch project from database to get the stored board_id column (e.g., "13", "28")
    const project = await projectService.getById(projectId);
    const projectIdx = project.board_id || '1';
    
    // 2. Compute dynamic sprint index or default to 52
    let sprintIdx = 52;
    try {
      const sprintData = await projectService.getSprints(projectId);
      const sprints = sprintData.sprints || [];
      const foundIdx = sprints.findIndex(s => s.id === sprintId);
      if (foundIdx !== -1) {
        sprintIdx = foundIdx + 1;
      } else if (sprintId && sprintId.startsWith('SP')) {
        const num = parseInt(sprintId.replace('SP', ''), 10);
        if (!isNaN(num)) sprintIdx = num;
      } else {
        const num = parseInt(sprintId, 10);
        if (!isNaN(num)) sprintIdx = num;
      }
    } catch (e) {
      console.warn('Could not compute dynamic sprint index, using default 52:', e.message);
    }
    
    const boardUrl = `https://sprints.zoho.in/workspace/sanmedia#P${projectIdx}/board/SP${sprintIdx}`;
    res.json({ success: true, url: boardUrl });
  } catch (err) {
    console.error('Error building board URL', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = { router };
