const express = require('express');
const router = express.Router();
const brainBridge = require('../services/brainWebSocketBridge');

/**
 * Brain Routes — /api/brain/*
 * ---------------------------------------------------------
 * All AI-specific operations that require the Python Brain.
 * Node.js forwards the request to Brain via WebSocket.
 */

// GET /api/brain/status
// Returns whether the Node.js → Brain WebSocket is connected.
router.get('/status', (req, res) => {
    try {
        const status = brainBridge.status();
        res.json({
            ...status,
            timestamp: new Date().toISOString(),
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/brain/trigger-orchestration
// Triggers the full Brain Agent AI orchestration pipeline.
// Brain will: validate TODO tasks → write test cases → assign to workers → evaluate reports.
router.post('/trigger-orchestration', async (req, res) => {
    try {
        if (!brainBridge.isConnected) {
            return res.status(503).json({
                error: 'Brain is not connected. Please ensure the Python Brain server is running.',
                connected: false,
            });
        }
        console.log('🧠 Triggering Brain Agent Orchestration via WebSocket...');
        const result = await brainBridge.send('orchestrate', {});
        res.json(result);
    } catch (err) {
        console.error('❌ Brain orchestration error:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// GET /api/brain/check-ai
// Check if OpenAI or Ollama is configured and reachable in Brain.
router.get('/check-ai', async (req, res) => {
    try {
        if (!brainBridge.isConnected) {
            return res.status(503).json({
                available: false,
                error: 'Brain is not connected',
                connected: false,
            });
        }
        const result = await brainBridge.send('check-ai', {});
        res.json(result);
    } catch (err) {
        console.error('❌ Brain check-ai error:', err.message);
        res.status(500).json({ available: false, error: err.message });
    }
});

// POST /api/brain/generate-prompt
// Generate an AI test prompt for a given URL.
// Body: { url: "https://example.com" }
router.post('/generate-prompt', async (req, res) => {
    try {
        const { url } = req.body;
        if (!url) {
            return res.status(400).json({ error: 'url is required' });
        }
        if (!brainBridge.isConnected) {
            return res.status(503).json({
                error: 'Brain is not connected',
                connected: false,
            });
        }
        const result = await brainBridge.send('generate-prompt', { url });
        res.json(result);
    } catch (err) {
        console.error('❌ Brain generate-prompt error:', err.message);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
