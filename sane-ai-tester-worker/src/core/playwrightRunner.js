const { chromium } = require('playwright');
const fs = require('fs-extra');
const path = require('path');
const logger = require('../utils/logger');

class PlaywrightRunner {
    constructor(options = {}) {
        this.headless = options.headless !== undefined ? options.headless : false;
        this.slowMo = options.slowMo || 100;
        this.recordVideo = options.recordVideo || false;
        this.screenshotPath = options.screenshotPath || './recordings/screenshots';
        this.videoPath = options.videoPath || './recordings/videos';
        this.browser = null;
        this.context = null;
        this.page = null;
    }
    
    async initialize() {
        logger.info("Initializing Playwright Chromium browser...");
        this.browser = await chromium.launch({
            headless: this.headless,
            slowMo: this.slowMo,
            args: ['--start-maximized']
        });
        
        logger.info("✅ Playwright Browser launched successfully");
    }
    
    async createContext(options = {}) {
        const contextOptions = {
            viewport: { width: 1280, height: 720 },
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            recordVideo: this.recordVideo ? {
                dir: this.videoPath,
                size: { width: 1280, height: 720 }
            } : undefined,
            ...options
        };
        
        this.context = await this.browser.newContext(contextOptions);
        this.page = await this.context.newPage();
        
        logger.info("✅ Browser context created");
        return { context: this.context, page: this.page };
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
            await this.createContext();
            
            if (options.url) {
                logger.info(`🌐 Navigating page to: ${options.url}`);
                await this.page.goto(options.url, { 
                    waitUntil: 'networkidle',
                    timeout: 30000 
                });
            }
            
            // Execute each action in order
            for (let i = 0; i < actions.length; i++) {
                const action = actions[i];
                logger.info(`🎬 Executing action ${i + 1}/${actions.length}: ${action.type}`);
                
                try {
                    await this.executeAction(action);
                } catch (actionError) {
                    logger.error(`Action fail: ${action.type} - ${actionError.message}`);
                    throw actionError;
                }
                
                // Small delay between actions
                await this.page.waitForTimeout(800);
            }
            
            // Take final screenshot
            result.screenshot = await this.takeScreenshot('final');
            result.data = await this.getPageData();
            result.success = true;
            logger.info("✅ All actions completed successfully");
            
        } catch (error) {
            logger.error(`❌ Playwright Execution error: ${error.message}`);
            result.error = error.message;
            result.stackTrace = error.stack;
            
            try {
                if (this.page) {
                    result.screenshot = await this.takeScreenshot('error');
                }
            } catch (e) {
                logger.error(`Failed to take error screenshot: ${e.message}`);
            }
            
        } finally {
            if (this.recordVideo && this.page && this.page.video) {
                try {
                    result.videoPath = await this.page.video().path();
                } catch (vErr) {
                    logger.error(`Failed to retrieve video path: ${vErr.message}`);
                }
            }
            await this.closeContext();
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

        const scriptLogger = {
            info: (msg) => { logger.info(`[AI Script] ${msg}`); result.logs.push(`INFO: ${msg}`); },
            warn: (msg) => { logger.warn(`[AI Script] ${msg}`); result.logs.push(`WARN: ${msg}`); },
            error: (msg) => { logger.error(`[AI Script] ${msg}`); result.logs.push(`ERROR: ${msg}`); }
        };

        try {
            const contextOptions = {
                viewport: { width: 1280, height: 720 },
                userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                recordVideo: this.recordVideo ? {
                    dir: this.videoPath,
                    size: { width: 1280, height: 720 }
                } : undefined
            };

            this.context = await this.browser.newContext(contextOptions);
            this.page = await this.context.newPage();
            
            if (options.url) {
                logger.info(`🌐 Navigating page to: ${options.url}`);
                await this.page.goto(options.url, { waitUntil: 'networkidle', timeout: 30000 });
            }

            logger.info(`🎬 Executing Playwright Generated Dynamic Script...`);
            
            // Execute the raw JS code dynamically inside an AsyncFunction
            const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;
            const dynamicExecution = new AsyncFunction('page', 'logger', scriptCode);
            
            await dynamicExecution(this.page, scriptLogger);

            await this.page.waitForTimeout(1000);

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
            if (this.recordVideo && this.page && this.page.video) {
                try {
                    result.videoPath = await this.page.video().path();
                    logger.info(`📹 Native video saved temporarily to: ${result.videoPath}`);
                } catch (vErr) {
                    logger.error(`Failed to retrieve video path: ${vErr.message}`);
                }
            }
            await this.closeContext();
        }

        return result;
    }
    
    async executeAction(action) {
        const { type, selector, value, options = {} } = action;
        
        switch (type) {
            case 'click':
                await this.page.click(selector, options);
                break;
                
            case 'fill':
            case 'type':
                await this.page.fill(selector, String(value || ''));
                break;
                
            case 'select':
                await this.page.selectOption(selector, String(value || ''));
                break;
                
            case 'wait':
                const waitTime = parseInt(value) || 1000;
                await this.page.waitForTimeout(waitTime);
                break;
                
            case 'waitForSelector':
                await this.page.waitForSelector(selector, { timeout: options.timeout || 10000 });
                break;
                
            case 'hover':
                await this.page.hover(selector);
                break;
                
            case 'press':
                await this.page.press(selector, value || 'Enter');
                break;
                
            case 'scroll':
                await this.page.evaluate(() => window.scrollBy(0, 500));
                break;
                
            default:
                logger.warn(`Unknown action type ignored: ${type}`);
        }
    }
    
    async getDOMContext(url) {
        let tempContext = null;
        let tempPage = null;
        try {
            tempContext = await this.browser.newContext({
                userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            });
            tempPage = await tempContext.newPage();
            await tempPage.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
            
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
            if (tempPage) await tempPage.close().catch(() => {});
            if (tempContext) await tempContext.close().catch(() => {});
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

    async closeContext() {
        if (this.page) {
            await this.page.close().catch(() => {});
            this.page = null;
        }
        if (this.context) {
            await this.context.close().catch(() => {});
            this.context = null;
        }
    }
    
    async close() {
        await this.closeContext();
        if (this.browser) {
            await this.browser.close().catch(() => {});
            this.browser = null;
        }
        logger.info("🔒 Browser session closed");
    }
}

module.exports = PlaywrightRunner;