const { Pool } = require('pg');

class Database {
    constructor() {
        this.pool = null;
    }

    connect() {
        this.pool = new Pool({
            connectionString: "postgres://postgres:Iniyal@14@94.249.213.61:5432/aiDev"
        });

        this.pool.connect((err, client, release) => {
            if (err) {
                console.error('❌ Database connection error:', err.stack);
            } else {
                console.log('✅ Database connected successfully');
                release();
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