const db = require('../config/database');
const ConfigModel = require('../models/config.model');

class ConfigRepository {
    async findAll() {
        const result = await db.query('SELECT * FROM system_config ORDER BY config_key ASC');
        return result.rows.map(row => new ConfigModel(row));
    }

    async findByKey(key) {
        const result = await db.query('SELECT * FROM system_config WHERE config_key = $1', [key]);
        return result.rows[0] ? new ConfigModel(result.rows[0]) : null;
    }

    async create(configData) {
        const { config_key, config_value, config_type, description, updated_by } = configData;
        const result = await db.query(
            `INSERT INTO system_config 
             (config_key, config_value, config_type, description, updated_by, updated_at) 
             VALUES ($1, $2, $3, $4, $5, NOW()) 
             RETURNING *`,
            [config_key, config_value, config_type, description, updated_by]
        );
        return new ConfigModel(result.rows[0]);
    }

    async update(key, configData) {
        const { config_value, config_type, description, updated_by } = configData;
        const result = await db.query(
            `UPDATE system_config 
             SET config_value = COALESCE($1, config_value), 
                 config_type = COALESCE($2, config_type), 
                 description = COALESCE($3, description),
                 updated_by = COALESCE($4, updated_by),
                 updated_at = NOW() 
             WHERE config_key = $5 RETURNING *`,
            [config_value, config_type, description, updated_by, key]
        );
        return result.rows[0] ? new ConfigModel(result.rows[0]) : null;
    }
}

module.exports = new ConfigRepository();
