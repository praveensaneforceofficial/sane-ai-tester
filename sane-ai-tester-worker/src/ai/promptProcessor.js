class PromptProcessor {
    process(prompt) {
        return prompt.trim();
    }
}
module.exports = new PromptProcessor();
