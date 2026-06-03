const axios = require('axios');
const logger = require('../utils/logger');
const config = require('../utils/config');

class AIExecutor {
    constructor() {
        this.aiMode = config.AI_MODE || 'openai';
        this.ollamaUrl = config.OLLAMA_URL;
        this.ollamaModel = config.OLLAMA_MODEL;
        this.openaiKey = config.OPENAI_API_KEY;
        this.openaiModel = config.OPENAI_MODEL;
    }
    
    /**
     * Generates a raw Playwright JavaScript script based on the task prompt/instructions.
     * @param {string} prompt Test instructions from the brain
     * @param {string} url Target URL
     * @param {string} domContext Live DOM structure of the page to guide selector identification
     * @returns {Promise<string>} Raw JavaScript code to execute
     */
    async generatePlaywrightScript(prompt, url, domContext = "") {
        logger.info("🧠 Generating dynamic Playwright script via AI...");
        
        const systemPrompt = `You are a Senior QA Automation Engineer writing a Playwright automation script in JavaScript.
Your task is to convert the user's instructions into raw JavaScript code.
The code you generate will be executed dynamically inside an AsyncFunction.

AVAILABLE CONTEXT:
- 'page' : The active Playwright Page object. It is already initialized and navigated to the target URL.
- 'logger' : A logging object with logger.info(), logger.warn(), logger.error().

RULES:
1. ONLY return the raw JavaScript code to execute the steps. NO markdown formatting, NO triple backticks, NO explanations.
2. DO NOT include "const { chromium } = require('playwright')" or browser/context/page initialization.
3. Use Playwright standard commands: 
   - await page.waitForSelector('selector', { timeout: 10000 })
   - await page.click('selector')
   - await page.fill('selector', 'value')
   - await page.selectOption('selector', 'value')
   - await page.waitForTimeout(milliseconds)
4. Add relevant logger.info() statements to document progress.
5. If you need to click text, use page.locator('text=Your Text').click().
6. The code must be self-contained and run synchronously.
7. ROBUSTNESS IS CRITICAL. For interactions, use try-catch blocks with at least 3 fallback strategies. 
   - Strategy 1: Standard selector (CSS/XPath) using page.click('...', { timeout: 5000 }).
   - Strategy 2: Text-based locator using page.getByText('...').click({ force: true, timeout: 5000 }).
   - Strategy 3: X,Y Coordinate Mouse Click. Fetch the bounding box and use mouse.click:
     const box = await page.locator('...').boundingBox();
     if (box) await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
   CRITICAL WARNING: NEVER use Playwright pseudo-selectors (like :has-text) inside document.querySelector! document.querySelector only supports standard CSS.
8. Add generous page.waitForTimeout(2000) after logins or navigations before interacting with elements to ensure SPA renders completely.
9. AMBIGUOUS SELECTIONS: If instructed to "select any division" or similar, DO NOT assume it's a <select> dropdown. It might be a list of radio buttons. Use 'await page.locator(\'input[type="radio"]\').first().click({ force: true })' as a highly effective fallback.
10. GENERIC BUTTONS: If told to click "Enter" or "Submit", use 'await page.locator(\'text="Enter"\').first().click({ force: true })' or 'page.getByRole(\'button\', { name: /enter/i }).click()'. Do not assume the tag is exactly <button>.

Example Robust Click:
try {
    await page.click('select[name="division"]', { timeout: 5000 });
} catch(e) {
    logger.warn("Standard click failed, trying text locator");
    try {
        await page.getByText('Division', { exact: false }).click({ timeout: 5000, force: true });
    } catch(e2) {
        logger.warn("Text click failed, using X,Y coordinate click");
        const loc = page.locator('select').first();
        const box = await loc.boundingBox();
        if (box) {
            await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
        } else {
            // Absolute last resort raw JS
            await page.evaluate(() => { 
                const el = document.querySelector('select'); 
                if(el) el.click(); 
            });
        }
    }
}

Example Output format:
logger.info("Starting execution");
await page.waitForTimeout(2000);
await page.waitForSelector('input[name="username"]', { state: 'attached' });
await page.fill('input[name="username"]', 'admin');
await page.click('button[type="submit"]');
logger.info("Finished");
`;

        let userPrompt = `Target URL: ${url}\nInstructions: ${prompt}\n\n`;
        if (domContext) {
            userPrompt += `DOM SELECTOR CONTEXT OF TARGET PAGE:\n${domContext}\n\n`;
        }
        userPrompt += `Please generate the raw Playwright JavaScript code to execute this test scenario. Make sure to use the exact matching selectors from the DOM Selector Context above if provided!`;

        try {
            let scriptCode = "";
            
            if (this.aiMode === 'openai' && this.openaiKey) {
                scriptCode = await this.callOpenAI(systemPrompt, userPrompt);
            } else if (this.aiMode === 'local') {
                scriptCode = await this.callOllama(systemPrompt + "\n" + userPrompt);
            } else {
                if (this.openaiKey) {
                    scriptCode = await this.callOpenAI(systemPrompt, userPrompt);
                } else {
                    scriptCode = await this.callOllama(systemPrompt + "\n" + userPrompt);
                }
            }
            
            // Clean up Markdown backticks if AI accidentally includes them
            scriptCode = scriptCode.replace(/^```javascript\s*/i, '')
                                   .replace(/^```js\s*/i, '')
                                   .replace(/^```\s*/, '')
                                   .replace(/```\s*$/, '');
            
            logger.info("✅ Successfully generated dynamic Playwright script");
            return scriptCode.trim();
            
        } catch (error) {
            logger.error(`AI Script Generation failed: ${error.message}`);
            throw new Error(`Failed to generate test script: ${error.message}`);
        }
    }

    /**
     * Analyzes execution logs and generates a summary report.
     */
    async generateSummary(prompt, logs, success) {
        logger.info("🧠 Generating execution summary via AI...");
        
        const systemPrompt = `You are a QA Automation Reporter. 
Based on the original test instructions and the execution logs provided, generate a concise, human-readable summary of what was tested, whether it succeeded, and any notable issues.

Format your response as a professional summary report (1-3 small paragraphs). No code, just natural language.`;

        const userPrompt = `Test Instructions: ${prompt}\nExecution Success: ${success}\nExecution Logs:\n${logs}`;

        try {
            if (this.aiMode === 'openai' && this.openaiKey) {
                return await this.callOpenAI(systemPrompt, userPrompt);
            } else if (this.aiMode === 'local') {
                return await this.callOllama(systemPrompt + "\n" + userPrompt);
            } else {
                if (this.openaiKey) {
                    return await this.callOpenAI(systemPrompt, userPrompt);
                } else {
                    return await this.callOllama(systemPrompt + "\n" + userPrompt);
                }
            }
        } catch (err) {
            logger.error(`Summary generation failed: ${err.message}`);
            return success ? "Test executed successfully." : "Test failed during execution. See logs.";
        }
    }
    
    async callOpenAI(systemPrompt, userPrompt) {
        try {
            const response = await axios.post('https://api.openai.com/v1/chat/completions', {
                model: this.openaiModel || 'gpt-4o',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt }
                ],
                temperature: 0.2,
                max_tokens: 3000
            }, {
                headers: {
                    'Authorization': `Bearer ${this.openaiKey}`,
                    'Content-Type': 'application/json'
                }
            });
            
            return response.data.choices[0].message.content;
            
        } catch (error) {
            logger.error(`OpenAI API error: ${error.response ? JSON.stringify(error.response.data) : error.message}`);
            throw error;
        }
    }
    
    async callOllama(prompt) {
        try {
            const response = await axios.post(`${this.ollamaUrl}/api/generate`, {
                model: this.ollamaModel || 'llama3',
                prompt: prompt,
                stream: false,
                temperature: 0.2
            });
            
            return response.data.response;
            
        } catch (error) {
            logger.error(`Ollama API error: ${error.message}`);
            throw error;
        }
    }
    
    async analyzeError(error, stackTrace) {
        const analysisPrompt = `Analyze this test automation error and provide: 1. Root cause 2. Suggested fix\n\nError: ${error}\nStack Trace: ${stackTrace || 'Not available'}`;
        try {
            if (this.aiMode === 'openai' && this.openaiKey) {
                return await this.callOpenAI("You are a QA automation debugger.", analysisPrompt);
            } else {
                return await this.callOllama(analysisPrompt);
            }
        } catch (err) {
            return `Error: ${error}`;
        }
    }
}

module.exports = AIExecutor;