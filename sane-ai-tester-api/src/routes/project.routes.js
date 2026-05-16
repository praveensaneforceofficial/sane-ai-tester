const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');

router.get('/', projectController.getAllProjects);
router.post('/', projectController.createProject);
router.get('/active', projectController.getActiveProjects);
router.post('/sync', projectController.syncZohoProjects);
router.get('/category/:category', projectController.getProjectsByCategory);
router.get('/:projectJobjId', projectController.getProjectById);
router.put('/:projectJobjId', projectController.updateProject);
router.delete('/:projectJobjId', projectController.deleteProject);

module.exports = router;
