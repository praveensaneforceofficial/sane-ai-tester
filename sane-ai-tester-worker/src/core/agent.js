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

            let objective = task.prompt || task.test_instructions || 'Navigate and check page';
            // Prepend URL to objective if not present
            if (!objective.includes(task.url)) {
                objective = `Navigate to ${task.url}\n${objective}`;
            }

            logger.info(`🤖 Starting browser-use Python Agent for objective: ${objective}`);
            
            const { spawn } = require('child_process');
            const path = require('path');
            
            const pythonExe = path.join(__dirname, '..', '..', '.venv', 'Scripts', 'python.exe');
            const scriptPath = path.join(__dirname, '..', '..', 'run_browser_use.py');
            
            resultData = await new Promise((resolve, reject) => {
                const pyProc = spawn(pythonExe, [scriptPath, objective]);
                
                let outputData = '';
                let errorData = '';
                
                pyProc.stdout.on('data', (data) => {
                    outputData += data.toString();
                    logger.info(`[browser-use] ${data.toString().trim()}`);
                });
                
                pyProc.stderr.on('data', (data) => {
                    errorData += data.toString();
                    logger.warn(`[browser-use log] ${data.toString().trim()}`);
                });
                
                pyProc.on('close', async (code) => {
                    logger.info(`🤖 browser-use exited with code ${code}`);
                    try {
                        let videoUrl = null;
                        if (this.enableRecording) {
                            try {
                                const videoDir = config.VIDEO_PATH;
                                if (await fs.pathExists(videoDir)) {
                                    const files = await fs.readdir(videoDir);
                                    const webmFiles = files.filter(f => f.endsWith('.webm') || f.endsWith('.mp4'));
                                    if (webmFiles.length > 0) {
                                        let latestFile = null;
                                        let latestTime = 0;
                                        for (const file of webmFiles) {
                                            const fullPath = path.join(videoDir, file);
                                            const stat = await fs.stat(fullPath);
                                            if (stat.mtimeMs > latestTime && stat.mtimeMs >= startTime) {
                                                latestTime = stat.mtimeMs;
                                                latestFile = fullPath;
                                            }
                                        }
                                        if (latestFile) {
                                            logger.info(`🎥 Found video recording: ${latestFile}. Uploading to R2/S3...`);
                                            videoUrl = await s3Service.uploadFile(latestFile);
                                        }
                                    }
                                }
                            } catch (err) {
                                logger.error(`❌ Error finding/uploading video: ${err.message}`);
                            }
                        }

                        // Find the JSON block in the output
                        const lines = outputData.split('\n');
                        let parsed = null;
                        for (let line of lines.reverse()) {
                            try {
                                parsed = JSON.parse(line);
                                break;
                            } catch (e) {}
                        }
                        
                        if (parsed) {
                            resolve({
                                status: parsed.success ? 'completed' : 'failed',
                                screenshotUrl: null,
                                videoUrl: videoUrl,
                                error: parsed.error || null,
                                data: null,
                                summary: parsed.result || 'Execution finished',
                                duration: Date.now() - startTime
                            });
                        } else {
                            resolve({
                                status: 'failed',
                                screenshotUrl: null,
                                videoUrl: videoUrl,
                                error: errorData || 'No JSON output from python script',
                                data: null,
                                summary: 'Execution failed or crashed',
                                duration: Date.now() - startTime
                            });
                        }
                    } catch (err) {
                        resolve({
                            status: 'failed',
                            error: 'Failed to parse python output: ' + err.message,
                            duration: Date.now() - startTime
                        });
                    }
                });
            });

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