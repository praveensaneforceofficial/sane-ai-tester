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

    // =========================================================================
    // NEW: Step-by-step vision loop methods (used by the new agent.js)
    // =========================================================================

    /**
     * Navigate to a URL using a persistent browser context.
     * The context + page stay alive across all steps of a task.
     * @param {string} url - Target URL to navigate to
     */
    async goto(url) {
        // Create a persistent context if one doesn't exist
        if (!this.context || !this.page) {
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
            logger.info("✅ Persistent browser context created for task");
        }

        logger.info(`🌐 Navigating to: ${url}`);
        await this.page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
        // Wait for SPA frameworks to fully render
        await this.page.waitForTimeout(2000);
        logger.info(`✅ Page loaded: ${url}`);
    }

    /**
     * Extract DOM context (inputs, buttons, links) from the CURRENT live page.
     * Unlike the old getDOMContext(), this does NOT open a temp tab — it reads from the active page.
     * @returns {Promise<string>} Formatted DOM context string
     */
    async getCurrentDOM() {
        if (!this.page) {
            throw new Error("No active page. Call goto() first.");
        }

        const context = await this.page.evaluate(() => {
            const inputs = Array.from(document.querySelectorAll('input, select, textarea')).map(el => {
                return `Input - name: "${el.name || ''}", id: "${el.id || ''}", type: "${el.type || ''}", placeholder: "${el.placeholder || ''}", value: "${el.value || ''}"`;
            });
            const buttons = Array.from(document.querySelectorAll('button, input[type="submit"], input[type="button"], a.btn, button.btn, [role="button"]')).map(el => {
                return `Button - text: "${(el.innerText || el.value || '').substring(0, 80)}", id: "${el.id || ''}", name: "${el.name || ''}", class: "${el.className || ''}"`;
            });
            const links = Array.from(document.querySelectorAll('a[href]')).map(el => {
                return `Link - text: "${(el.innerText || '').substring(0, 60)}", href: "${el.href || ''}", id: "${el.id || ''}"`;
            });
            const selects = Array.from(document.querySelectorAll('select')).map(el => {
                const options = Array.from(el.options).map(o => o.text).slice(0, 5).join(', ');
                return `Select - name: "${el.name || ''}", id: "${el.id || ''}", options: [${options}]`;
            });
            return {
                title: document.title,
                url: window.location.href,
                inputs: inputs.slice(0, 20),
                buttons: buttons.slice(0, 15),
                links: links.slice(0, 10),
                selects: selects.slice(0, 10)
            };
        });

        let result = `Page Title: "${context.title}"\nCurrent URL: ${context.url}\n`;
        if (context.inputs.length > 0)  result += `\nAvailable Inputs:\n${context.inputs.join('\n')}`;
        if (context.selects.length > 0) result += `\nAvailable Selects:\n${context.selects.join('\n')}`;
        if (context.buttons.length > 0) result += `\nAvailable Buttons:\n${context.buttons.join('\n')}`;
        if (context.links.length > 0)   result += `\nAvailable Links:\n${context.links.join('\n')}`;
        return result;
    }

    /**
     * Execute a single Playwright command string on the live page.
     * The command is raw JS code like: await page.click('#submit')
     * @param {string} commandString - Raw Playwright JS command(s)
     * @returns {Promise<{success: boolean, error: string|null}>}
     */
    async executeSingleCommand(commandString) {
        if (!this.page) {
            return { success: false, error: "No active page. Call goto() first." };
        }

        try {
            const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;
            const dynamicExecution = new AsyncFunction('page', 'logger', commandString);
            
            const scriptLogger = {
                info: (msg) => logger.info(`[Step Command] ${msg}`),
                warn: (msg) => logger.warn(`[Step Command] ${msg}`),
                error: (msg) => logger.error(`[Step Command] ${msg}`)
            };

            await dynamicExecution(this.page, scriptLogger);
            
            // Wait for any navigation/render triggered by the command
            await this.page.waitForTimeout(1500);
            
            return { success: true, error: null };
        } catch (error) {
            logger.error(`❌ Single command execution failed: ${error.message}`);
            return { success: false, error: error.message };
        }
    }

    /**
     * Get the video recording path from the current persistent page.
     * @returns {Promise<string|null>} Path to the video file or null
     */
    async getVideoPath() {
        if (this.page && this.page.video) {
            try {
                return await this.page.video().path();
            } catch (err) {
                logger.error(`Failed to retrieve video path: ${err.message}`);
                return null;
            }
        }
        return null;
    }

    // =========================================================================
    // MODIFIED: takeScreenshot now returns FILE PATH (not base64)
    // =========================================================================

    /**
     * Take a screenshot of the current page and save to disk.
     * @param {string} name - Name prefix for the screenshot file
     * @returns {Promise<string|null>} Absolute file path to the saved screenshot
     */
    async takeScreenshot(name) {
        try {
            if (!this.page) {
                logger.error("Cannot take screenshot: no active page");
                return null;
            }
            
            const timestamp = Date.now();
            const filename = `${name}_${timestamp}.png`;
            const filepath = path.resolve(this.screenshotPath, filename);
            
            await fs.ensureDir(this.screenshotPath);
            await this.page.screenshot({ path: filepath, fullPage: true });
            
            logger.info(`📸 Screenshot saved: ${filepath}`);
            return filepath;
        } catch (error) {
            logger.error(`Failed to capture screenshot: ${error.message}`);
            return null;
        }
    }

    // =========================================================================
    // LEGACY: Old methods kept for backwards compatibility
    // =========================================================================

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