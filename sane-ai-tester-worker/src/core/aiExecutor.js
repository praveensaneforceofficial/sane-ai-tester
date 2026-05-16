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
    
    async parsePrompt(prompt, url) {
        logger.info("🤖 Parsing AI prompt...");
        
        const systemPrompt = `You are a test automation expert. Convert the following instruction into Playwright actions.
        Return ONLY a JSON array of actions. Each action must have a "type" and required parameters.
        
        Available action types:
        - click: needs "selector" (CSS or text selector)
        - fill/type: needs "selector" and "value"
        - select: needs "selector" and "value"
        - wait: needs "value" (milliseconds)
        - waitForSelector: needs "selector"
        - hover: needs "selector"
        - press: needs "selector" (element to press) and "value" (key)
        - scroll: scrolls page down
        
        For login: use selectors like 'input[name="username"]', 'input[name="password"]', 'button[type="submit"]'
        For navigation: use click with text selectors like 'text=Reports' or 'text=Menu'
        
        Example: For "login with username test and password 123", return:
        [{"type":"fill","selector":"input[name='username']","value":"test"},{"type":"fill","selector":"input[name='password']","value":"123"},{"type":"click","selector":"button[type='submit']"}]
        
        Instruction: ${prompt}
        Target URL: ${url}`;
        
        try {
            let actions = [];
            
            if (this.aiMode === 'openai' && this.openaiKey) {
                actions = await this.callOpenAI(systemPrompt);
            } else {
                actions = await this.callOllama(systemPrompt);
            }
            
            // Validate and clean actions
            if (!Array.isArray(actions)) {
                logger.warn("AI response not an array, using fallback");
                actions = this.getFallbackActions(prompt, url);
            }
            
            logger.info(`✅ Generated ${actions.length} actions`);
            return actions;
            
        } catch (error) {
            logger.error(`AI parsing failed: ${error.message}`);
            return this.getFallbackActions(prompt, url);
        }
    }
    
    async callOpenAI(prompt) {
        try {
            const response = await axios.post('https://api.openai.com/v1/chat/completions', {
                model: this.openaiModel,
                messages: [
                    { role: 'system', content: 'You are a test automation assistant. Return only valid JSON arrays.' },
                    { role: 'user', content: prompt }
                ],
                temperature: 0.3,
                max_tokens: 2000
            }, {
                headers: {
                    'Authorization': `Bearer ${this.openaiKey}`,
                    'Content-Type': 'application/json'
                }
            });
            
            const content = response.data.choices[0].message.content;
            return this.extractJSON(content);
            
        } catch (error) {
            logger.error(`OpenAI API error: ${error.message}`);
            throw error;
        }
    }
    
    async callOllama(prompt) {
        try {
            const response = await axios.post(`${this.ollamaUrl}/api/generate`, {
                model: this.ollamaModel,
                prompt: prompt,
                stream: false,
                temperature: 0.3
            });
            
            const content = response.data.response;
            return this.extractJSON(content);
            
        } catch (error) {
            logger.error(`Ollama API error: ${error.message}`);
            throw error;
        }
    }
    
    extractJSON(text) {
        // Try to extract JSON from response
        const jsonMatch = text.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
            try {
                return JSON.parse(jsonMatch[0]);
            } catch (e) {
                logger.warn(`Failed to parse JSON: ${e.message}`);
            }
        }
        return [];
    }
    
    getFallbackActions(prompt, url) {
        // Basic fallback actions based on keywords
        const actions = [];
        const lowerPrompt = prompt.toLowerCase();
        
        // Navigation
        actions.push({ type: 'wait', value: 2000 });
        
        // Login detection
        if (lowerPrompt.includes('login') || lowerPrompt.includes('sign in')) {
            actions.push({ type: 'fill', selector: 'input[name="username"], input[type="email"], #username', value: 'testuser' });
            actions.push({ type: 'fill', selector: 'input[name="password"], input[type="password"], #password', value: 'testpass' });
            actions.push({ type: 'click', selector: 'button[type="submit"], input[type="submit"], button:has-text("Login"), button:has-text("Sign in")' });
            actions.push({ type: 'wait', value: 3000 });
        }
        
        // Navigation to reports
        if (lowerPrompt.includes('report') || lowerPrompt.includes('navigate')) {
            actions.push({ type: 'click', selector: 'a:has-text("Reports"), button:has-text("Reports"), a:has-text("Report"), button:has-text("Report")' });
            actions.push({ type: 'wait', value: 2000 });
        }
        
        // Search
        if (lowerPrompt.includes('search') || lowerPrompt.includes('find')) {
            actions.push({ type: 'fill', selector: 'input[type="search"], input[name="search"], #search', value: 'test data' });
            actions.push({ type: 'click', selector: 'button[type="submit"], button:has-text("Search")' });
            actions.push({ type: 'wait', value: 2000 });
        }
        
        actions.push({ type: 'wait', value: 1000 });
        
        return actions;
    }
    
    async analyzeError(error, stackTrace) {
        const analysisPrompt = `Analyze this test automation error and provide:
        1. Root cause
        2. Suggested fix
        3. Prevention measures
        
        Error: ${error}
        Stack Trace: ${stackTrace || 'Not available'}`;
        
        try {
            if (this.aiMode === 'openai' && this.openaiKey) {
                const response = await axios.post('https://api.openai.com/v1/chat/completions', {
                    model: this.openaiModel,
                    messages: [{ role: 'user', content: analysisPrompt }],
                    temperature: 0.5
                }, {
                    headers: { 'Authorization': `Bearer ${this.openaiKey}` }
                });
                return response.data.choices[0].message.content;
            } else {
                const response = await axios.post(`${this.ollamaUrl}/api/generate`, {
                    model: this.ollamaModel,
                    prompt: analysisPrompt,
                    stream: false
                });
                return response.data.response;
            }
        } catch (err) {
            logger.error(`Error analysis failed: ${err.message}`);
            return `Error: ${error}`;
        }
    }
}

module.exports = AIExecutor;