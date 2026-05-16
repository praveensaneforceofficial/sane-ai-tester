const PlaywrightRunner = require('./playwrightRunner');
const AIExecutor = require('./aiExecutor');
const logger = require('../utils/logger');
const fs = require('fs-extra');
const path = require('path');
const config = require('../utils/config');

class Agent {
    constructor(workerId, socket, options = {}) {
        this.workerId = workerId;
        this.socket = socket;
        this.isRunning = false;
        this.currentTask = null;
        this.enableRecording = options.enableRecording || false;
        this.playwrightRunner = null;
        this.aiExecutor = new AIExecutor();
        this.taskHistory = [];
        
        // Create recording directories
        if (this.enableRecording) {
            fs.ensureDirSync(config.VIDEO_PATH);
            fs.ensureDirSync(config.SCREENSHOT_PATH);
        }
    }
    
    async start() {
        this.isRunning = true;
        logger.info(`🚀 Agent ${this.workerId} started`);
        this.emitStatus('online');
        
        // Initialize Playwright
        this.playwrightRunner = new PlaywrightRunner({
            headless: config.BROWSER_HEADLESS,
            slowMo: config.BROWSER_SLOW_MO,
            recordVideo: this.enableRecording,
            screenshotPath: config.SCREENSHOT_PATH,
            videoPath: config.VIDEO_PATH
        });
        
        await this.playwrightRunner.initialize();
        logger.info("✅ Playwright initialized");
    }
    
    async executeTask(task) {
        if (this.currentTask) {
            logger.warn("Already executing a task, skipping...");
            return;
        }
        
        this.currentTask = task;
        this.emitTaskStatus('running');
        
        const startTime = Date.now();
        let result = {
            taskId: task.taskId,
            workerId: this.workerId,
            status: 'failed',
            screenshot: null,
            video: null,
            error: null,
            data: null,
            duration: 0
        };
        
        try {
            logger.info(`🎯 Executing task: ${task.taskId}`);
            
            // Parse AI prompt to get actions
            const actions = await this.aiExecutor.parsePrompt(task.prompt, task.url);
            logger.info(`📋 Generated ${actions.length} actions from AI`);
            
            // Execute actions with Playwright
            const executionResult = await this.playwrightRunner.executeActions(actions, {
                url: task.url,
                taskId: task.taskId,
                recordVideo: this.enableRecording
            });
            
            result.status = executionResult.success ? 'completed' : 'failed';
            result.screenshot = executionResult.screenshot;
            result.video = executionResult.videoPath;
            result.data = executionResult.data;
            
            if (!executionResult.success) {
                result.error = executionResult.error;
                
                // Analyze error with AI
                const analysis = await this.aiExecutor.analyzeError(
                    executionResult.error,
                    executionResult.stackTrace
                );
                result.data = { ...result.data, analysis };
            }
            
            logger.info(`✅ Task ${task.taskId} completed with status: ${result.status}`);
            
        } catch (error) {
            logger.error(`❌ Task execution failed: ${error.message}`);
            result.error = error.message;
            result.status = 'failed';
            
            // Take error screenshot
            if (this.playwrightRunner) {
                const screenshot = await this.playwrightRunner.takeScreenshot('error');
                result.screenshot = screenshot;
            }
        }
        
        result.duration = Date.now() - startTime;
        
        // Store in history
        this.taskHistory.push({
            taskId: task.taskId,
            timestamp: new Date().toISOString(),
            result
        });
        
        // Send result back to brain
        this.socket.emit('task-finished', result);
        
        // Cleanup
        this.currentTask = null;
        this.emitTaskStatus('idle');
        
        return result;
    }
    
    async cleanup() {
        logger.info("🧹 Cleaning up agent...");
        if (this.playwrightRunner) {
            await this.playwrightRunner.close();
        }
        this.isRunning = false;
        this.emitStatus('offline');
    }
    
    emitStatus(status) {
        if (this.onStatusCallback) {
            this.onStatusCallback(status);
        }
    }
    
    emitTaskStatus(status) {
        this.socket.emit('worker-status', {
            workerId: this.workerId,
            status,
            taskId: this.currentTask?.taskId
        });
    }
    
    on(event, callback) {
        if (event === 'status') {
            this.onStatusCallback = callback;
        }
    }
    
    getHistory() {
        return this.taskHistory;
    }
}

module.exports = Agent;