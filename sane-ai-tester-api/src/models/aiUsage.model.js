class AiUsageModel {
    constructor(data) {
        this.id = data.id;
        this.usageId = data.usage_id;
        this.apiType = data.api_type;
        this.apiEndpoint = data.api_endpoint;
        this.requestType = data.request_type;
        this.requestData = data.request_data;
        this.responseData = data.response_data;
        this.tokensUsed = data.tokens_used;
        this.promptTokens = data.prompt_tokens;
        this.completionTokens = data.completion_tokens;
        this.requestDuration = data.request_duration;
        this.statusCode = data.status_code;
        this.success = data.success;
        this.errorMessage = data.error_message;
        this.source = data.source;
        this.sourceId = data.source_id;
        this.timestamp = data.timestamp;
    }

    toJSON() {
        return {
            id: this.id,
            usage_id: this.usageId,
            api_type: this.apiType,
            api_endpoint: this.apiEndpoint,
            request_type: this.requestType,
            request_data: this.requestData,
            response_data: this.responseData,
            tokens_used: this.tokensUsed,
            prompt_tokens: this.promptTokens,
            completion_tokens: this.completionTokens,
            request_duration: this.requestDuration,
            status_code: this.statusCode,
            success: this.success,
            error_message: this.errorMessage,
            source: this.source,
            source_id: this.sourceId,
            timestamp: this.timestamp
        };
    }
}

module.exports = AiUsageModel;
