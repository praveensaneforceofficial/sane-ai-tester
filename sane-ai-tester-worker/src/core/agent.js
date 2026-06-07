const PlaywrightRunner = require('./playwrightRunner');
const AIExecutor = require('./aiExecutor');
const s3Service = require('../services/s3Service');
const logger = require('../utils/logger');
const fs = require('fs-extra');
const config = require('../utils/config');

class Agent {
    constructor(workerId, socket, options = {}) {
        this.workerId = workerId;
        this.socket = socket;
        this.isRunning = false;
        this.currentTask = null;
        this.enableRecording = options.enableRecording || false;
        this.playwrightRunner = null;
        this.aiExecutor = new AIExecutor(); // Assumed to handle vision inputs now
        this.taskHistory = [];
        
        if (this.enableRecording) {
            fs.ensureDirSync(config.VIDEO_PATH);
            fs.ensureDirSync(config.SCREENSHOT_PATH);
        }
    }
    
    async start() {
        this.isRunning = true;
        logger.info(`🚀 Agent ${this.workerId} started`);
        
        this.playwrightRunner = new PlaywrightRunner({
            headless: config.BROWSER_HEADLESS,
            slowMo: config.BROWSER_SLOW_MO,
            recordVideo: this.enableRecording,
            screenshotPath: config.SCREENSHOT_PATH,
            videoPath: config.VIDEO_PATH
        });
        
        await this.playwrightRunner.initialize();
        logger.info("✅ Agent Automation Framework (Playwright) initialized");
        this.emitStatus('active');
    }
    
    async executeTask(task) {
        this.currentTask = task;
        const startTime = Date.now();
        let resultData = {
            status: 'failed',
            screenshotUrl: null,
            videoUrl: null,
            error: null,
            data: null,
            summary: null,
            duration: 0
        };
        
        try {
            logger.info(`🎯 Executing step-by-step interactive task ID: ${task.taskId || task.id}`);
            
            this.socket.emit('worker:task:start', {
                taskId: task.taskId || task.id,
                workerId: this.workerId
            });

            // Initial navigation
            await this.playwrightRunner.goto(task.url);
            
            let objective = task.prompt || task.test_instructions || 'Navigate and check page';
            let isTaskComplete = false;
            let currentStepNum = 1;
            let executionLogs = [];
            let lastErrorAnalysis = null;
            const MAX_STEPS = 50; // Circuit breaker to prevent infinite AI loops

            // Main Interactive Loop
            while (!isTaskComplete && currentStepNum <= MAX_STEPS) {
                logger.info(`📍 --- Processing Step/Level ${currentStepNum} ---`);
                
                // 1. Capture the current state (Screenshot + DOM)
                const screenshotPath = await this.playwrightRunner.takeScreenshot(`step_${currentStepNum}`);
                let domContext = "";
                try {
                    domContext = await this.playwrightRunner.getCurrentDOM();
                } catch (e) {
                    logger.warn(`Could not fetch DOM: ${e.message}`);
                }

                // 2. Upload screenshot to R2 so AI (or central server) can access via URL if needed
                const publicScreenshotUrl = await s3Service.uploadFile(screenshotPath);

                // 3. Ask AI to analyze the screenshot + state
                // The AI determines if there's an error, and returns either the next command OR a fix.
                logger.info(`🧠 Sending screenshot to AI for validation and next instruction...`);
                const aiResponse = await this.aiExecutor.analyzeStateAndGetNextStep({
                    objective,
                    currentStepNum,
                    screenshotUrl: publicScreenshotUrl,
                    localScreenshotPath: screenshotPath, // alternative if using local base64
                    domContext,
                    lastError: lastErrorAnalysis
                });

                // Expecting aiResponse structure: 
                // { isComplete: boolean, hasError: boolean, errorAnalysis: string, nextPlaywrightCommand: string }
                
                if (aiResponse.isComplete) {
                    logger.info(`🎉 AI declared objective accomplished at step ${currentStepNum}!`);
                    isTaskComplete = true;
                    resultData.status = 'completed';
                    break;
                }

                if (aiResponse.hasError) {
                    logger.warn(`⚠️ AI Detected an error on the screen: ${aiResponse.errorAnalysis}`);
                    lastErrorAnalysis = aiResponse.errorAnalysis;
                    
                    // Emit error back to Server/SI immediately from this exact point
                    this.socket.emit('worker:task:step_error', {
                        taskId: task.taskId || task.id,
                        step: currentStepNum,
                        errorAnalysis: aiResponse.errorAnalysis,
                        screenshotUrl: publicScreenshotUrl
                    });
                } else {
                    // Clear error context if current step looks clean
                    lastErrorAnalysis = null; 
                }

                // 4. Execute the single instruction given by the AI from this specific point
                if (aiResponse.nextPlaywrightCommand) {
                    logger.info(`⚡ Executing AI Instruction: ${aiResponse.nextPlaywrightCommand}`);
                    const stepResult = await this.playwrightRunner.executeSingleCommand(aiResponse.nextPlaywrightCommand);
                    
                    executionLogs.push(`Step ${currentStepNum}: ${aiResponse.nextPlaywrightCommand} -> Success: ${stepResult.success}`);
                    
                    if (!stepResult.success) {
                        // Infrastructure/Playwright code level execution crash
                        lastErrorAnalysis = `Playwright Execution Failed: ${stepResult.error}`;
                    }
                }

                currentStepNum++;
            }

            if (currentStepNum > MAX_STEPS && !isTaskComplete) {
                throw new Error(`Task stopped: Reached maximum step limit of ${MAX_STEPS}`);
            }

            // Generate Summary based on step history
            const summary = await this.aiExecutor.generateSummary(objective, executionLogs.join('\n'), resultData.status === 'completed');
            resultData.summary = summary;

            // Handle optional video upload
            if (this.enableRecording) {
                const videoPath = await this.playwrightRunner.getVideoPath();
                if (videoPath) {
                    resultData.videoUrl = await s3Service.uploadFile(videoPath);
                }
            }

            this.socket.emit('worker:task:complete', {
                taskId: task.taskId || task.id,
                workerId: this.workerId,
                resultData: resultData
            });

        } catch (error) {
            logger.error(`❌ Task execution failed critically: ${error.message}`);
            resultData.error = error.message;
            resultData.status = 'failed';
            
            this.socket.emit('worker:task:error', {
                taskId: task.taskId || task.id,
                workerId: this.workerId,
                error: error.message
            });
        }
        
        resultData.duration = Date.now() - startTime;
        this.taskHistory.push({
            taskId: task.taskId || task.id,
            timestamp: new Date().toISOString(),
            result: resultData
        });
        
        this.currentTask = null;
        return resultData;
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
        if (this.socket && this.socket.connected && this.workerId) {
            this.socket.emit('worker:status', { 
                workerId: this.workerId, 
                action: status 
            });
        }
    }
}

module.exports = Agent;