const puppeteer = require('puppeteer');
const { PuppeteerScreenRecorder } = require('puppeteer-screen-recorder');
const fs = require('fs-extra');
const path = require('path');
const logger = require('../utils/logger');

class PuppeteerRunner {
    constructor(options = {}) {
        this.headless = options.headless !== undefined ? options.headless : false;
        this.slowMo = options.slowMo || 100;
        this.recordVideo = options.recordVideo || false;
        this.screenshotPath = options.screenshotPath || './recordings/screenshots';
        this.videoPath = options.videoPath || './recordings/videos';
        this.browser = null;
        this.page = null;
        this.recorder = null;
        this.currentVideoPath = null;
    }
    
    async initialize() {
        logger.info("Initializing Puppeteer browser...");
        this.browser = await puppeteer.launch({
            headless: this.headless ? 'new' : false,
            slowMo: this.slowMo,
            defaultViewport: { width: 1280, height: 720 },
            args: ['--start-maximized', '--no-sandbox', '--disable-setuid-sandbox']
        });
        
        logger.info("✅ Puppeteer Browser launched successfully");
    }
    
    async executeActions(actions, options = {}) {
        const result = {
            success: false,
            screenshot: null,
            videoPath: null,
            data: {},
            error: null,
            stackTrace: null
        };
        
        try {
            this.page = await this.browser.newPage();
            await this.page.setDefaultNavigationTimeout(30000);
            
            // Set User Agent to avoid detection
            await this.page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

            // Setup and start video recording
            if (this.recordVideo) {
                await fs.ensureDir(this.videoPath);
                const videoFilename = `${options.taskId || Date.now()}.mp4`;
                this.currentVideoPath = path.resolve(path.join(this.videoPath, videoFilename));
                
                this.recorder = new PuppeteerScreenRecorder(this.page, {
                    followNewTab: true,
                    fps: 25,
                    videoFrame: {
                        width: 1280,
                        height: 720,
                    },
                    aspectRatio: '16:9',
                });
                
                logger.info(`📹 Starting screen recording to: ${this.currentVideoPath}`);
                await this.recorder.start(this.currentVideoPath);
            }
            
            // Navigate to URL
            if (options.url) {
                logger.info(`🌐 Navigating page to: ${options.url}`);
                await this.page.goto(options.url, { 
                    waitUntil: 'networkidle2',
                    timeout: 30000 
                });
            }
            
            // Execute each action in order
            for (let i = 0; i < actions.length; i++) {
                const action = actions[i];
                logger.info(`🎬 Executing action ${i + 1}/${actions.length}: ${action.type} (Selector: ${action.selector})`);
                
                try {
                    await this.executeAction(action);
                } catch (actionError) {
                    logger.error(`Action fail: ${action.type} - ${actionError.message}`);
                    throw actionError;
                }
                
                // Small delay between actions
                await new Promise(resolve => setTimeout(resolve, 800));
            }
            
            // Take final screenshot
            result.screenshot = await this.takeScreenshot('final');
            
            // Get page metadata summary
            result.data = await this.getPageData();
            result.success = true;
            logger.info("✅ All actions completed successfully");
            
        } catch (error) {
            logger.error(`❌ Puppeteer Execution error: ${error.message}`);
            result.error = error.message;
            result.stackTrace = error.stack;
            
            // Take error screenshot
            try {
                if (this.page) {
                    result.screenshot = await this.takeScreenshot('error');
                }
            } catch (e) {
                logger.error(`Failed to take error screenshot: ${e.message}`);
            }
            
        } finally {
            // Stop screen recording if enabled
            if (this.recordVideo && this.recorder) {
                try {
                    logger.info("📹 Stopping screen recording...");
                    await this.recorder.stop();
                    result.videoPath = this.currentVideoPath;
                } catch (recErr) {
                    logger.error(`Failed to stop screen recorder: ${recErr.message}`);
                }
            }
            
            // Close page
            if (this.page) {
                await this.page.close().catch(() => {});
                this.page = null;
            }
        }
        
        return result;
    }
    
    async executeDynamicScript(scriptCode, options = {}) {
        const result = {
            success: false,
            screenshot: null,
            videoPath: null,
            data: {},
            error: null,
            stackTrace: null,
            logs: []
        };
        
        // Custom logger for the dynamic script
        const scriptLogger = {
            info: (msg) => { logger.info(`[AI Script] ${msg}`); result.logs.push(`INFO: ${msg}`); },
            warn: (msg) => { logger.warn(`[AI Script] ${msg}`); result.logs.push(`WARN: ${msg}`); },
            error: (msg) => { logger.error(`[AI Script] ${msg}`); result.logs.push(`ERROR: ${msg}`); }
        };

        try {
            this.page = await this.browser.newPage();
            await this.page.setDefaultNavigationTimeout(30000);
            await this.page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

            if (this.recordVideo) {
                await fs.ensureDir(this.videoPath);
                const videoFilename = `${options.taskId || Date.now()}_dynamic.mp4`;
                this.currentVideoPath = path.resolve(path.join(this.videoPath, videoFilename));
                
                this.recorder = new PuppeteerScreenRecorder(this.page, {
                    followNewTab: true, fps: 25, videoFrame: { width: 1280, height: 720 }, aspectRatio: '16:9',
                });
                logger.info(`📹 Starting screen recording to: ${this.currentVideoPath}`);
                await this.recorder.start(this.currentVideoPath);
            }
            
            if (options.url) {
                logger.info(`🌐 Navigating page to: ${options.url}`);
                await this.page.goto(options.url, { waitUntil: 'networkidle2', timeout: 30000 });
            }
            
            logger.info(`🎬 Executing AI Generated Dynamic Script...`);
            
            // Execute the raw JS code dynamically inside an AsyncFunction
            const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;
            const dynamicExecution = new AsyncFunction('page', 'logger', scriptCode);
            
            await dynamicExecution(this.page, scriptLogger);
            
            // Take final screenshot
            result.screenshot = await this.takeScreenshot('final');
            result.data = await this.getPageData();
            result.success = true;
            logger.info("✅ Dynamic Script completed successfully");
            
        } catch (error) {
            logger.error(`❌ Dynamic Script Execution error: ${error.message}`);
            result.error = error.message;
            result.stackTrace = error.stack;
            try {
                if (this.page) result.screenshot = await this.takeScreenshot('error');
            } catch (e) {}
        } finally {
            if (this.recordVideo && this.recorder) {
                try {
                    await this.recorder.stop();
                    result.videoPath = this.currentVideoPath;
                } catch (e) {}
            }
            if (this.page) {
                await this.page.close().catch(() => {});
                this.page = null;
            }
        }
        
        return result;
    }
    
    async executeAction(action) {
        const { type, selector, value, options = {} } = action;
        
        // Clean text selector format if present ('text=Some value')
        let finalSelector = selector;
        let isTextSelector = false;
        
        if (selector && selector.startsWith('text=')) {
            finalSelector = selector.substring(5);
            isTextSelector = true;
        }
        
        switch (type) {
            case 'click':
                if (isTextSelector) {
                    // XPath to find elements by inner text
                    const xPathSelector = `//*[contains(text(), '${finalSelector}')]`;
                    await this.page.waitForXPath(xPathSelector, { timeout: 10000 });
                    const [element] = await this.page.$x(xPathSelector);
                    if (element) {
                        await element.click();
                    } else {
                        throw new Error(`Text element not found: ${finalSelector}`);
                    }
                } else {
                    await this.page.waitForSelector(finalSelector, { timeout: 10000 });
                    await this.page.click(finalSelector);
                }
                break;
                
            case 'fill':
            case 'type':
                await this.page.waitForSelector(finalSelector, { timeout: 10000 });
                // Clear the element before typing
                await this.page.evaluate((sel) => {
                    const el = document.querySelector(sel);
                    if (el) el.value = '';
                }, finalSelector);
                await this.page.type(finalSelector, String(value || ''));
                break;
                
            case 'select':
                await this.page.waitForSelector(finalSelector, { timeout: 10000 });
                await this.page.select(finalSelector, String(value || ''));
                break;
                
            case 'wait':
                const waitTime = parseInt(value) || 1000;
                await new Promise(resolve => setTimeout(resolve, waitTime));
                break;
                
            case 'waitForSelector':
                await this.page.waitForSelector(finalSelector, { timeout: options.timeout || 10000 });
                break;
                
            case 'hover':
                await this.page.waitForSelector(finalSelector, { timeout: 10000 });
                await this.page.hover(finalSelector);
                break;
                
            case 'press':
                await this.page.waitForSelector(finalSelector, { timeout: 10000 });
                await this.page.focus(finalSelector);
                await this.page.keyboard.press(value || 'Enter');
                break;
                
            case 'evaluate':
                await this.page.evaluate(value);
                break;
                
            case 'scroll':
                await this.page.evaluate(() => window.scrollBy(0, 500));
                break;
                
            default:
                logger.warn(`Unknown action type ignored: ${type}`);
        }
    }
    
    async takeScreenshot(name) {
        try {
            const timestamp = Date.now();
            const filename = `${name}_${timestamp}.png`;
            const filepath = path.join(this.screenshotPath, filename);
            
            await fs.ensureDir(this.screenshotPath);
            await this.page.screenshot({ path: filepath, fullPage: true });
            
            // Return base64 encoded screen capture
            const base64 = await this.page.screenshot({ encoding: 'base64', fullPage: true });
            return base64;
        } catch (error) {
            logger.error(`Failed to capture screenshot: ${error.message}`);
            return null;
        }
    }
    
    async getPageData() {
        try {
            const data = await this.page.evaluate(() => {
                return {
                    title: document.title,
                    url: window.location.href,
                    bodyText: document.body?.innerText?.substring(0, 2000) || '',
                    hasError: document.body?.innerText?.toLowerCase().includes('error') || false
                };
            });
            return data;
        } catch (error) {
            logger.error(`Failed to capture page data summary: ${error.message}`);
            return {};
        }
    }
    
    async getDOMContext(url) {
        let tempPage = null;
        try {
            tempPage = await this.browser.newPage();
            await tempPage.setDefaultNavigationTimeout(30000);
            await tempPage.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
            await tempPage.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
            
            const context = await tempPage.evaluate(() => {
                const inputs = Array.from(document.querySelectorAll('input, select, textarea')).map(el => {
                    return `Input - name: "${el.name || ''}", id: "${el.id || ''}", type: "${el.type || ''}", placeholder: "${el.placeholder || ''}"`;
                });
                const buttons = Array.from(document.querySelectorAll('button, input[type="submit"], input[type="button"], a.btn, button.btn')).map(el => {
                    return `Button - text: "${el.innerText || el.value || ''}", id: "${el.id || ''}", name: "${el.name || ''}", outerHTML: "${el.outerHTML.substring(0, 150)}..."`;
                });
                return {
                    title: document.title,
                    inputs: inputs.slice(0, 15),
                    buttons: buttons.slice(0, 15)
                };
            });
            
            return `Page Title: "${context.title}"\nAvailable Inputs:\n${context.inputs.join('\n')}\nAvailable Buttons:\n${context.buttons.join('\n')}`;
        } catch (err) {
            logger.error(`Failed to extract DOM context: ${err.message}`);
            return "No DOM context available due to error.";
        } finally {
            if (tempPage) {
                await tempPage.close().catch(() => {});
            }
        }
    }
    
    async close() {
        if (this.browser) {
            await this.browser.close().catch(() => {});
            this.browser = null;
        }
        logger.info("🔒 Browser session closed");
    }
}

module.exports = PuppeteerRunner;
