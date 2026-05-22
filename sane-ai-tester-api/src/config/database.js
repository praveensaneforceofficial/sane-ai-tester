const { Pool } = require('pg');

// DB config — hardcoded for IIS/iisnode (dotenv not reliable in IIS environment)
const DB_CONFIG = {
    host: '94.249.213.61',
    port: 5432,
    user: 'postgres',
    password: 'Iniyal@14',
    database: 'aiDev',
    ssl: false,
    max: 10,
    min: 1,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
};

class Database {
    constructor() {
        this.pool = null;
        this._connected = false;
        this._retryTimer = null;
    }

    connect() {
        // End existing pool if reconnecting
        if (this.pool) {
            this.pool.end().catch(() => {});
            this.pool = null;
        }

        this._connected = false;

        console.log(`🔌 Connecting to DB: ${DB_CONFIG.host}:${DB_CONFIG.port}/${DB_CONFIG.database}`);

        this.pool = new Pool(DB_CONFIG);

        // Handle unexpected pool errors (prevents server crash)
        this.pool.on('error', (err) => {
            console.error('❌ Unexpected DB pool error:', err.message);
            this._connected = false;
        });

        this.pool.connect(async (err, client, release) => {
            if (err) {
                console.error('❌ Database connection error:', err.message);
                console.log('🔁 Retrying DB connection in 10 seconds...');
                this._connected = false;
                // Auto-retry after 10 seconds
                this._retryTimer = setTimeout(() => this.connect(), 10000);
            } else {
                this._connected = true;
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
                    console.error('❌ Failed to initialize custom_task_actions table:', dbErr.message);
                }

                // Initialize git_triggers table if not exists
                try {
                    await this.pool.query(`
                        CREATE TABLE IF NOT EXISTS git_triggers (
                            id SERIAL PRIMARY KEY,
                            branch VARCHAR(255) NOT NULL,
                            repository VARCHAR(255) NOT NULL,
                            pr_number INT NOT NULL,
                            commit_sha VARCHAR(100) NOT NULL,
                            author VARCHAR(100) NOT NULL,
                            description TEXT,
                            comment TEXT,
                            action VARCHAR(50),
                            status VARCHAR(50) DEFAULT 'pending',
                            created_at TIMESTAMP DEFAULT NOW(),
                            updated_at TIMESTAMP DEFAULT NOW()
                        );

                        ALTER TABLE git_triggers ADD COLUMN IF NOT EXISTS description TEXT;
                        ALTER TABLE git_triggers ADD COLUMN IF NOT EXISTS comment TEXT;
                        ALTER TABLE git_triggers ADD COLUMN IF NOT EXISTS action VARCHAR(50);
                    `);
                    console.log('✅ Checked and ensured git_triggers table exists with updated columns.');
                } catch (dbErr) {
                    console.error('❌ Failed to initialize/alter git_triggers table:', dbErr.message);
                }
            }
        });
    }

    isConnected() {
        return this._connected;
    }

    getPool() {
        return this.pool;
    }

    async query(text, params) {
        if (!this.pool) {
            throw new Error('Database not connected. Please try again shortly.');
        }
        return this.pool.query(text, params);
    }

    async close() {
        if (this._retryTimer) {
            clearTimeout(this._retryTimer);
        }
        if (this.pool) {
            await this.pool.end();
            console.log('Database pool closed');
        }
    }
}

module.exports = new Database();