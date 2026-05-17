const PuppeteerRunner = require('./puppeteerRunner');
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
        this.puppeteerRunner = null;
        this.aiExecutor = new AIExecutor();
        this.taskHistory = [];
        
        if (this.enableRecording) {
            fs.ensureDirSync(config.VIDEO_PATH);
            fs.ensureDirSync(config.SCREENSHOT_PATH);
        }
    }
    
    async start() {
        this.isRunning = true;
        logger.info(`🚀 Agent ${this.workerId} started`);
        this.emitStatus('active');
        
        this.puppeteerRunner = new PuppeteerRunner({
            headless: config.BROWSER_HEADLESS,
            slowMo: config.BROWSER_SLOW_MO,
            recordVideo: this.enableRecording,
            screenshotPath: config.SCREENSHOT_PATH,
            videoPath: config.VIDEO_PATH
        });
        
        await this.puppeteerRunner.initialize();
        logger.info("✅ Agent Automation Framework initialized");
    }
    
    async executeTask(task) {
        if (this.currentTask) {
            logger.warn("⚠️ Already executing a task, skipping new assignment...");
            return;
        }
        
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
            logger.info(`🎯 Executing task ID: ${task.taskId || task.id}`);
            
            const instructions = task.prompt || task.test_instructions || 'Navigate and check page';
            
            // 0. Extract DOM Selector Context to assist the AI
            let domContext = "";
            try {
                logger.info(`🔍 Fetching live DOM context from ${task.url} to guide the AI...`);
                domContext = await this.puppeteerRunner.getDOMContext(task.url);
            } catch (domErr) {
                logger.warn(`⚠️ Could not retrieve live DOM context: ${domErr.message}`);
            }

            // 1. Generate Puppeteer Script dynamically via AI
            const scriptCode = await this.aiExecutor.generatePuppeteerScript(instructions, task.url, domContext);
            
            // 2. Execute the generated Script directly
            const executionResult = await this.puppeteerRunner.executeDynamicScript(scriptCode, {
                url: task.url,
                taskId: task.taskId || task.id,
                recordVideo: this.enableRecording
            });
            
            resultData.status = executionResult.success ? 'completed' : 'failed';
            resultData.data = executionResult.data;
            
            if (!executionResult.success) {
                resultData.error = executionResult.error;
            }

            // 3. Generate Human-Readable Summary using AI
            const rawLogs = executionResult.logs ? executionResult.logs.join('\n') : '';
            const summary = await this.aiExecutor.generateSummary(instructions, rawLogs, executionResult.success);
            resultData.summary = summary;
            logger.info(`📝 AI Summary Generated:\n${summary}`);

            // 4. Upload video to Cloudflare R2
            if (executionResult.videoPath) {
                logger.info(`⏳ Uploading execution video to Cloudflare R2...`);
                const publicVideoUrl = await s3Service.uploadFile(executionResult.videoPath);
                if (publicVideoUrl) {
                    resultData.videoUrl = publicVideoUrl;
                }
            }
            
            logger.info(`✅ Task ${task.taskId || task.id} completed with status: ${resultData.status}`);
            
            // Emit success back to API
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
        if (this.puppeteerRunner) {
            await this.puppeteerRunner.close();
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