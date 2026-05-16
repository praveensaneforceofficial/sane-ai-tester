const db = require('../config/database');
const WorkerModel = require('../models/worker.model');

class WorkerRepository {
    async findAll() {
        const result = await db.query('SELECT * FROM worker_registry ORDER BY id ASC');
        return result.rows.map(row => new WorkerModel(row));
    }

    async findById(workerId) {
        const result = await db.query('SELECT * FROM worker_registry WHERE worker_id = $1', [workerId]);
        return result.rows[0] ? new WorkerModel(result.rows[0]) : null;
    }

    async findByMachineId(machineId) {
        const result = await db.query('SELECT * FROM worker_registry WHERE machine_id = $1', [machineId]);
        return result.rows[0] ? new WorkerModel(result.rows[0]) : null;
    }

    async create(workerData) {
        const { workerId, nickname, machineId, systemIp, osPlatform } = workerData;
        const result = await db.query(
            `INSERT INTO worker_registry 
             (worker_id, nickname, machine_id, system_ip, os_platform, status, last_seen, created_at) 
             VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW()) 
             RETURNING *`,
            [workerId, nickname, machineId, systemIp, osPlatform, 'online']
        );
        return new WorkerModel(result.rows[0]);
    }

    async updateStatus(workerId, status) {
        const result = await db.query(
            'UPDATE worker_registry SET status = $1, updated_at = NOW() WHERE worker_id = $2 RETURNING *',
            [status, workerId]
        );
        return result.rows[0] ? new WorkerModel(result.rows[0]) : null;
    }

    async updateLastSeen(workerId) {
        const result = await db.query(
            'UPDATE worker_registry SET last_seen = NOW(), status = $1 WHERE worker_id = $2 RETURNING *',
            ['online', workerId]
        );
        return result.rows[0] ? new WorkerModel(result.rows[0]) : null;
    }

    async updateStatusByMachineId(machineId, status) {
        const result = await db.query(
            'UPDATE worker_registry SET status = $1, last_seen = NOW() WHERE machine_id = $2 RETURNING *',
            [status, machineId]
        );
        return result.rows[0] ? new WorkerModel(result.rows[0]) : null;
    }

    async delete(workerId) {
        const result = await db.query('DELETE FROM worker_registry WHERE worker_id = $1 RETURNING worker_id', [workerId]);
        return result.rows.length > 0;
    }

    async getNextWorkerId() {
        const result = await db.query('SELECT COUNT(*) FROM worker_registry');
        const count = parseInt(result.rows[0].count) + 1;
        return `sane-tester-${count.toString().padStart(3, '0')}`;
    }

    async markOfflineInactive() {
        const result = await db.query(`
            UPDATE worker_registry 
            SET status = 'offline', updated_at = NOW()
            WHERE status = 'online' 
            AND last_seen < NOW() - INTERVAL '60 seconds'
            RETURNING worker_id, nickname
        `);
        return result.rows;
    }
}

module.exports = new WorkerRepository();