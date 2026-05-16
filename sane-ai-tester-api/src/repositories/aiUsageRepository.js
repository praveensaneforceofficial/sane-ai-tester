const db = require('../config/database');
const AiUsageModel = require('../models/aiUsage.model');

class AiUsageRepository {
    async findAll() {
        const result = await db.query('SELECT * FROM ai_api_usage ORDER BY timestamp DESC');
        return result.rows.map(row => new AiUsageModel(row));
    }

    async create(usageData) {
        const { usage_id, api_type, api_endpoint, request_type, request_data, response_data, tokens_used, prompt_tokens, completion_tokens, request_duration, status_code, success, error_message, source, source_id } = usageData;
        const result = await db.query(
            `INSERT INTO ai_api_usage 
             (usage_id, api_type, api_endpoint, request_type, request_data, response_data, tokens_used, prompt_tokens, completion_tokens, request_duration, status_code, success, error_message, source, source_id, timestamp) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, NOW()) 
             RETURNING *`,
            [usage_id, api_type, api_endpoint, request_type, request_data, response_data, tokens_used, prompt_tokens, completion_tokens, request_duration, status_code, success, error_message, source, source_id]
        );
        return new AiUsageModel(result.rows[0]);
    }

    async findBySource(source) {
        const result = await db.query('SELECT * FROM ai_api_usage WHERE source = $1 ORDER BY timestamp DESC', [source]);
        return result.rows.map(row => new AiUsageModel(row));
    }

    async getSummary() {
        const result = await db.query(`
            SELECT 
                COUNT(*) as total_requests,
                SUM(tokens_used) as total_tokens,
                AVG(request_duration) as avg_duration,
                COUNT(CASE WHEN success = TRUE THEN 1 END) * 100.0 / COUNT(*) as success_rate
            FROM ai_api_usage
        `);
        return result.rows[0];
    }

    async getTokenStats() {
        const result = await db.query(`
            SELECT 
                api_type,
                SUM(prompt_tokens) as prompt_tokens,
                SUM(completion_tokens) as completion_tokens,
                SUM(tokens_used) as total_tokens
            FROM ai_api_usage
            GROUP BY api_type
        `);
        return result.rows;
    }
}

module.exports = new AiUsageRepository();
