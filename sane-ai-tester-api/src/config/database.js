const { Pool } = require('pg');
require('dotenv').config();

class Database {
    constructor() {
        this.pool = null;
    }

    connect() {
        this.pool = new Pool({
            host: process.env.DB_HOST,
            port: process.env.DB_PORT,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
        });

        this.pool.connect(async (err, client, release) => {
            if (err) {
                console.error('❌ Database connection error:', err.stack);
            } else {
                console.log('✅ Database connected successfully');
                release();
                
                // Initialize custom_task_actions table if not exists
                try {
                    await this.pool.query(`
                        CREATE TABLE IF NOT EXISTS custom_task_actions (
                            id SERIAL PRIMARY KEY,
                            custom_task_id VARCHAR(50) REFERENCES custom_tasks(custom_task_id) ON DELETE CASCADE,
                            action_type VARCHAR(100) NOT NULL,
                            description TEXT NOT NULL,
                            created_at TIMESTAMP DEFAULT NOW()
                        );
                    `);
                    console.log('✅ Checked and ensured custom_task_actions table exists.');
                } catch (dbErr) {
                    console.error('❌ Failed to initialize custom_task_actions table:', dbErr);
                }
            }
        });
    }

    getPool() {
        return this.pool;
    }

    async query(text, params) {
        return this.pool.query(text, params);
    }

    async close() {
        if (this.pool) {
            await this.pool.end();
            console.log('Database pool closed');
        }
    }
}

module.exports = new Database();