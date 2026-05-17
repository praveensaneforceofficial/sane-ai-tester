const axios = require('axios');
const logger = require('../utils/logger');
const config = require('../utils/config');

class AIExecutor {
    constructor() {
        this.aiMode = config.AI_MODE || 'local';
        this.ollamaUrl = config.OLLAMA_URL;
        this.ollamaModel = config.OLLAMA_MODEL;
        this.openaiKey = config.OPENAI_API_KEY;
        this.openaiModel = config.OPENAI_MODEL;
    }
    
    /**
     * Legacy parse prompt for static execution (keep for fallback)
     */
    async parsePrompt(prompt, url) {
        // Fallback functionality
        return this.getFallbackActions(prompt, url);
    }

    /**
     * Generates a raw Puppeteer JavaScript script based on the task prompt/instructions.
     * @param {string} prompt Test instructions from the brain
     * @param {string} url Target URL
     * @returns {Promise<string>} Raw JavaScript code to execute
     */
    async generatePuppeteerScript(prompt, url, domContext = "") {
        logger.info("🧠 Generating dynamic Puppeteer script via AI...");
        
        const systemPrompt = `You are a Senior QA Automation Engineer writing a Puppeteer automation script.
Your task is to convert the user's instructions into raw JavaScript code.
The code you generate will be executed dynamically inside an AsyncFunction.

AVAILABLE CONTEXT:
- 'page' : The active Puppeteer Page object. It is already initialized and navigated to the target URL.
- 'logger' : A logging object with logger.info(), logger.warn(), logger.error().

RULES:
1. ONLY return the raw JavaScript code to execute the steps. NO markdown formatting, NO \`\`\`javascript blocks, NO explanations.
2. DO NOT include "const puppeteer = require('puppeteer')" or browser initialization.
3. Use await page.waitForSelector(), await page.click(), await page.type(), etc.
4. Add relevant logger.info() statements to document progress.
5. If you need to search or assert text, use XPath or page.evaluate.
6. The code must be self-contained and run synchronously.

Example Output format:
logger.info("Starting execution");
await page.waitForSelector('input[name="username"]');
await page.type('input[name="username"]', 'admin');
await page.click('button[type="submit"]');
logger.info("Finished");
`;

        let userPrompt = `Target URL: ${url}\nInstructions: ${prompt}\n\n`;
        if (domContext) {
            userPrompt += `DOM SELECTOR CONTEXT OF TARGET PAGE:\n${domContext}\n\n`;
        }
        userPrompt += `Please generate the raw Puppeteer JavaScript code to execute this test scenario. Make sure to use the exact matching selectors from the DOM Selector Context above if provided!`;

        try {
            let scriptCode = "";
            
            // Respect AI_MODE configuration
            if (this.aiMode === 'openai' && this.openaiKey) {
                scriptCode = await this.callOpenAI(systemPrompt, userPrompt);
            } else if (this.aiMode === 'local') {
                scriptCode = await this.callOllama(systemPrompt + "\n" + userPrompt);
            } else {
                // Fallback
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
            
            logger.info("✅ Successfully generated dynamic script");
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
                // Fallback
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
                model: this.openaiModel,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt }
                ],
                temperature: 0.2, // Low temperature for code reliability
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
                model: this.ollamaModel,
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
    
    getFallbackActions(prompt, url) {
        // Basic fallback actions
        const actions = [];
        actions.push({ type: 'wait', value: 2000 });
        return actions;
    }
    
    async analyzeError(error, stackTrace) {
        const analysisPrompt = `Analyze this test automation error and provide: 1. Root cause 2. Suggested fix\n\nError: ${error}\nStack Trace: ${stackTrace || 'Not available'}`;
        try {
            if (this.openaiKey) {
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