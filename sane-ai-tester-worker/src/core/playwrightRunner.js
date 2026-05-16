const { chromium } = require('playwright');
const fs = require('fs-extra');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');

class PlaywrightRunner {
    constructor(options = {}) {
        this.headless = options.headless || false;
        this.slowMo = options.slowMo || 100;
        this.recordVideo = options.recordVideo || false;
        this.screenshotPath = options.screenshotPath || './recordings/screenshots';
        this.videoPath = options.videoPath || './recordings/videos';
        this.browser = null;
        this.context = null;
        this.page = null;
        this.currentVideoPath = null;
    }
    
    async initialize() {
        this.browser = await chromium.launch({
            headless: this.headless,
            slowMo: this.slowMo,
            args: ['--start-maximized']
        });
        
        logger.info("✅ Browser launched");
    }
    
    async createContext(options = {}) {
        const contextOptions = {
            viewport: { width: 1280, height: 720 },
            recordVideo: this.recordVideo ? {
                dir: this.videoPath,
                size: { width: 1280, height: 720 }
            } : undefined,
            ...options
        };
        
        this.context = await this.browser.newContext(contextOptions);
        this.page = await this.context.newPage();
        
        // Setup video path
        if (this.recordVideo && this.page.video) {
            this.currentVideoPath = await this.page.video().path();
        }
        
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
            // Create context for this task
            await this.createContext({ recordVideo: this.recordVideo });
            
            // Navigate to URL
            if (options.url) {
                logger.info(`🌐 Navigating to: ${options.url}`);
                await this.page.goto(options.url, { 
                    waitUntil: 'networkidle',
                    timeout: 30000 
                });
                await this.page.waitForLoadState('domcontentloaded');
            }
            
            // Execute each action
            for (let i = 0; i < actions.length; i++) {
                const action = actions[i];
                logger.info(`🎬 Executing action ${i + 1}/${actions.length}: ${action.type}`);
                
                try {
                    await this.executeAction(action);
                } catch (actionError) {
                    logger.error(`Action failed: ${action.type} - ${actionError.message}`);
                    throw actionError;
                }
                
                // Take screenshot after each action
                if (this.recordVideo) {
                    const screenshot = await this.takeScreenshot(`step_${i + 1}`);
                    if (!result.screenshot) result.screenshot = screenshot;
                }
                
                // Small delay between actions
                await this.page.waitForTimeout(500);
            }
            
            // Take final screenshot
            result.screenshot = await this.takeScreenshot('final');
            
            // Get page data
            result.data = await this.getPageData();
            
            // Get video path
            if (this.recordVideo && this.page.video) {
                result.videoPath = await this.page.video().path();
            }
            
            result.success = true;
            logger.info("✅ All actions executed successfully");
            
        } catch (error) {
            logger.error(`❌ Execution failed: ${error.message}`);
            result.error = error.message;
            result.stackTrace = error.stack;
            
            // Take error screenshot
            result.screenshot = await this.takeScreenshot('error');
            
        } finally {
            // Close page and context
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
                await this.page.fill(selector, value);
                break;
                
            case 'select':
                await this.page.selectOption(selector, value);
                break;
                
            case 'wait':
                await this.page.waitForTimeout(value || 1000);
                break;
                
            case 'waitForSelector':
                await this.page.waitForSelector(selector, { timeout: options.timeout || 10000 });
                break;
                
            case 'screenshot':
                // Already handled separately
                break;
                
            case 'hover':
                await this.page.hover(selector);
                break;
                
            case 'press':
                await this.page.press(selector, value);
                break;
                
            case 'evaluate':
                await this.page.evaluate(value);
                break;
                
            case 'scroll':
                await this.page.evaluate(() => window.scrollBy(0, 500));
                break;
                
            default:
                logger.warn(`Unknown action type: ${type}`);
        }
    }
    
    async takeScreenshot(name) {
        try {
            const timestamp = Date.now();
            const filename = `${name}_${timestamp}.png`;
            const filepath = path.join(this.screenshotPath, filename);
            
            await fs.ensureDir(this.screenshotPath);
            await this.page.screenshot({ path: filepath, fullPage: true });
            
            // Convert to base64 for sending to brain
            const base64 = await this.page.screenshot({ encoding: 'base64', fullPage: true });
            
            return base64;
        } catch (error) {
            logger.error(`Screenshot failed: ${error.message}`);
            return null;
        }
    }
    
    async getPageData() {
        try {
            const data = await this.page.evaluate(() => {
                return {
                    title: document.title,
                    url: window.location.href,
                    bodyText: document.body?.innerText?.substring(0, 2000),
                    hasError: document.body?.innerText?.toLowerCase().includes('error'),
                    visibleElements: Array.from(document.querySelectorAll('button, input, a, [role="button"]')).map(el => ({
                        tag: el.tagName,
                        text: el.innerText?.substring(0, 100),
                        visible: true
                    })).slice(0, 20)
                };
            });
            return data;
        } catch (error) {
            logger.error(`Failed to get page data: ${error.message}`);
            return {};
        }
    }
    
    async closeContext() {
        if (this.page) {
            await this.page.close();
            this.page = null;
        }
        if (this.context) {
            await this.context.close();
            this.context = null;
        }
    }
    
    async close() {
        await this.closeContext();
        if (this.browser) {
            await this.browser.close();
            this.browser = null;
        }
        logger.info("🔒 Browser closed");
    }
}

module.exports = PlaywrightRunner;