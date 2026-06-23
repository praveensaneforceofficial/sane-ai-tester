const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');
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

    // =========================================================================
    // NEW: Vision-based step-by-step analysis (used by the new agent.js)
    // =========================================================================

    /**
     * Analyzes the current DOM state and returns the next action.
     * Uses text-based AI models without sending screenshots.
     * 
     * @param {Object} params
     * @param {string} params.objective - The overall test objective/instructions
     * @param {number} params.currentStepNum - Current step number
     * @param {string} params.screenshotUrl - (Ignored) Public URL of the screenshot
     * @param {string} params.localScreenshotPath - (Ignored) Local file path of screenshot
     * @param {string} params.domContext - DOM context string from getCurrentDOM()
     * @param {string|null} params.lastError - Error from the previous step, if any
     * @returns {Promise<{isComplete: boolean, hasError: boolean, errorAnalysis: string, nextPlaywrightCommand: string}>}
     */
    async analyzeStateAndGetNextStep(params) {
        const { objective, currentStepNum, screenshotUrl, localScreenshotPath, domContext, lastError, previousCommands } = params;
        
        logger.info(`🧠 AI State Analysis — Step ${currentStepNum}...`);

        const systemPrompt = `You are a Senior QA Automation Agent.
You are controlling a web browser step-by-step to accomplish a test objective.

YOUR TASK:
1. Read the DOM context provided (available form inputs, buttons, links).
2. Determine if the objective has been accomplished based on the DOM structure.
3. If NOT accomplished, determine the SINGLE NEXT Playwright command to execute.
4. If you see an application error in the DOM context (error message, red alert, 404, etc.), report it.

RULES FOR nextPlaywrightCommand:
- Return EXACTLY ONE Playwright action as raw JavaScript code.
- The code has access to 'page' (Playwright Page object) and 'logger' (logging).
- Use robust selectors from the DOM context provided.
- Examples of valid commands:
  * await page.fill('#txtUserName', 'admin');
  * await page.click('#btnLogin');
  * await page.selectOption('select[name="division"]', 'value');
  * await page.waitForSelector('.dashboard', { timeout: 10000 });
  * await page.locator('text=Submit').click({ force: true });
  * await page.waitForTimeout(3000);
- For clicking elements that may be tricky, hidden, or inside hover cards/dropdowns, use try-catch with fallbacks and force clicks:
  try { await page.click('#exact-selector', { timeout: 5000 }); } catch(e) { await page.locator('text=Button Text').click({ force: true }); }
- CRITICAL FOR DROPDOWNS/HOVER MENUS: If an element only appears when hovering over a card or parent menu, ALWAYS hover first, wait briefly, then click:
  await page.locator('text=Parent Item').hover(); await page.waitForTimeout(500); await page.locator('text=Target Item').click({ force: true });
- IF A PREVIOUS COMMAND FAILED: **DO NOT repeat the exact same command.**
  * If the element was "not visible" or "intercepted", try using page.evaluate to force a click via the DOM (e.g. \`await page.evaluate(() => document.querySelector('button:has-text("+ Add New Field")').click())\`).
  * If it resolved to multiple elements ("strict mode violation"), use a more specific selector, or use \`.first()\`, or \`nth(0)\`.
- CRITICAL FOR DROPDOWNS AND INPUTS: If standard \`fill()\` or \`selectOption()\` fails or doesn't trigger page updates, simulate a real user using mouse and keyboard:
  * Dropdowns/Selects: \`await page.locator('select#control').click(); await page.waitForTimeout(500); await page.keyboard.press('ArrowDown'); await page.keyboard.press('Enter');\` (or type the option text).
  * Inputs: \`await page.locator('#txtUserName').click(); await page.keyboard.type('admin');\`
- DO NOT include browser/context initialization code.
- DO NOT return multiple unrelated steps — return only the immediate next action.
- Add a brief logger.info() to describe what you're doing.

RESPONSE FORMAT:
You MUST respond with ONLY a valid JSON object. No markdown, no backticks, no explanations outside the JSON.
{
    "isComplete": false,
    "hasError": false,
    "errorAnalysis": "",
    "nextPlaywrightCommand": "await page.click('#submit');"
}

- Set "isComplete": true when the test objective appears to be fully accomplished based on what you see in the DOM.
- Set "hasError": true if you see an application error (NOT a Playwright error) in the DOM, and describe it in "errorAnalysis".
- If hasError is true, still provide a nextPlaywrightCommand if possible (e.g., to dismiss the error or retry).
- If isComplete is true, nextPlaywrightCommand can be empty.`;

        let userPrompt = `OBJECTIVE: ${objective}\n`;
        userPrompt += `CURRENT STEP: ${currentStepNum}\n`;
        
        if (previousCommands && previousCommands.length > 0) {
            userPrompt += `\nPAST EXECUTION HISTORY (DO NOT repeat actions that did not change the state!):\n`;
            userPrompt += previousCommands.slice(-5).join('\n') + `\n`;
        }

        if (lastError) {
            userPrompt += `\n⚠️ PREVIOUS STEP ERROR: ${lastError}\nPlease account for this error and adjust your next action accordingly.\n`;
        }
        if (domContext) {
            userPrompt += `\nDOM CONTEXT OF CURRENT PAGE:\n${domContext}\n`;
        }
        userPrompt += `\nAnalyze the DOM context and determine the next action to accomplish the objective.`;

        try {
            let rawResponse = "";

            if (this.aiMode === 'openai' && this.openaiKey) {
                rawResponse = await this.callOpenAI(systemPrompt, userPrompt);
            } else if (this.aiMode === 'local') {
                rawResponse = await this.callOllama(systemPrompt + "\n" + userPrompt);
            } else {
                // Auto-detect: prefer OpenAI if key exists, otherwise Ollama
                if (this.openaiKey) {
                    rawResponse = await this.callOpenAI(systemPrompt, userPrompt);
                } else {
                    rawResponse = await this.callOllama(systemPrompt + "\n" + userPrompt);
                }
            }

            // Parse JSON from AI response (strip any accidental markdown)
            const cleaned = rawResponse
                .replace(/^```json\s*/i, '')
                .replace(/^```\s*/i, '')
                .replace(/```\s*$/i, '')
                .trim();
            
            const parsed = JSON.parse(cleaned);

            // Validate expected fields
            return {
                isComplete: parsed.isComplete === true,
                hasError: parsed.hasError === true,
                errorAnalysis: parsed.errorAnalysis || "",
                nextPlaywrightCommand: parsed.nextPlaywrightCommand || ""
            };

        } catch (error) {
            logger.error(`❌ AI Vision Analysis failed: ${error.message}`);
            // Return a safe fallback — don't crash the loop
            return {
                isComplete: false,
                hasError: true,
                errorAnalysis: `AI analysis failed: ${error.message}`,
                nextPlaywrightCommand: "await page.waitForTimeout(2000);"
            };
        }
    }

    /**
     * Call OpenAI API with vision (image_url) support.
     * Uses gpt-4o which supports image inputs natively.
     */
    async callOpenAIVision(systemPrompt, userPrompt, imageUrl, localImagePath) {
        // Build the image content block
        let imageContent;
        if (imageUrl) {
            // Use public URL (preferred — already uploaded to R2)
            imageContent = {
                type: "image_url",
                image_url: { url: imageUrl, detail: "high" }
            };
        } else if (localImagePath) {
            // Fallback: read local file as base64
            const imageBuffer = await fs.readFile(localImagePath);
            const base64 = imageBuffer.toString('base64');
            imageContent = {
                type: "image_url",
                image_url: { url: `data:image/png;base64,${base64}`, detail: "high" }
            };
        } else {
            throw new Error("No screenshot available for vision analysis");
        }

        try {
            const response = await axios.post('https://api.openai.com/v1/chat/completions', {
                model: this.openaiModel || 'gpt-4o',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { 
                        role: 'user', 
                        content: [
                            { type: "text", text: userPrompt },
                            imageContent
                        ]
                    }
                ],
                temperature: 0.2,
                max_tokens: 1500
            }, {
                headers: {
                    'Authorization': `Bearer ${this.openaiKey}`,
                    'Content-Type': 'application/json'
                },
                timeout: 60000 // 60s timeout for vision requests
            });

            return response.data.choices[0].message.content;

        } catch (error) {
            logger.error(`OpenAI Vision API error: ${error.response ? JSON.stringify(error.response.data) : error.message}`);
            throw error;
        }
    }

    /**
     * Call Ollama with a vision-capable model (e.g., llava, bakllava).
     * Sends the screenshot as base64 in the 'images' field.
     */
    async callOllamaVision(systemPrompt, userPrompt, localImagePath) {
        let images = [];
        if (localImagePath) {
            const imageBuffer = await fs.readFile(localImagePath);
            images = [imageBuffer.toString('base64')];
        }

        try {
            // Use a vision-capable model (llava) instead of text-only llama3
            const visionModel = config.OLLAMA_VISION_MODEL || 'llava';
            
            const response = await axios.post(`${this.ollamaUrl}/api/generate`, {
                model: visionModel,
                prompt: `${systemPrompt}\n\n${userPrompt}`,
                images: images,
                stream: false,
                temperature: 0.2
            }, {
                timeout: 120000 // 120s timeout for local vision models
            });

            return response.data.response;

        } catch (error) {
            logger.error(`Ollama Vision API error: ${error.message}`);
            throw error;
        }
    }

    // =========================================================================
    // EXISTING: Text-only methods (kept for generateSummary and legacy use)
    // =========================================================================
    
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
9. AMBIGUOUS SELECTIONS: If instructed to "select any division" or similar, DO NOT assume it's a <select> dropdown. It might be a list of radio buttons. Use 'await page.locator('input[type="radio"]').first().click({ force: true })' as a highly effective fallback.
10. GENERIC BUTTONS: If told to click "Enter" or "Submit", use 'await page.locator('text="Enter"').first().click({ force: true })' or 'page.getByRole('button', { name: /enter/i }).click()'. Do not assume the tag is exactly <button>.
11. LOGGING: DO NOT use logger.error() or logger.warn() inside try-catch fallbacks. Use logger.info("attempting fallback...") instead, to avoid false-positive error reports.
12. HOVER STATES: If an element might be hidden inside a dropdown or hover card, ALWAYS add a hover action before the click. Example: await page.locator('text=Parent').hover(); await page.waitForTimeout(500); await page.locator('text=Child').click({ force: true });`;

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

CRITICAL RULE: Ignore logs mentioning "fallback", "Standard click failed", or "trying text locator". These are normal AI fallback mechanisms, NOT application errors. ONLY report an issue if the execution definitively fails.

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