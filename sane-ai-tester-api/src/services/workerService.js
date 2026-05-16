const workerRepository = require('../repositories/workerRepository');

class WorkerService {
    async getAllWorkers() {
        const workers = await workerRepository.findAll();
        return workers.map(w => w.toJSON());
    }

    async getWorkerById(workerId) {
        const worker = await workerRepository.findById(workerId);
        if (!worker) {
            throw new Error('Worker not found');
        }
        return worker.toJSON();
    }

    async getWorkerByMachineId(machineId) {
        const worker = await workerRepository.findByMachineId(machineId);
        return worker ? worker.toJSON() : null;
    }

    async registerWorker(registrationData) {
        const { machineId, nickname, ip, os } = registrationData;

        // Check if already registered
        let worker = await workerRepository.findByMachineId(machineId);
        
        if (worker) {
            // Update existing worker
            await workerRepository.updateStatusByMachineId(machineId, 'online');
            return {
                workerId: worker.workerId,
                nickname: worker.nickname,
                isNew: false
            };
        }

        // Generate new worker ID
        const workerId = await workerRepository.getNextWorkerId();

        // Create new worker
        worker = await workerRepository.create({
            workerId,
            nickname,
            machineId,
            systemIp: ip,
            osPlatform: os
        });

        console.log(`✅ New Worker Registered: ${nickname} (${workerId})`);
        
        return {
            workerId: worker.workerId,
            nickname: worker.nickname,
            isNew: true
        };
    }

    async updateWorkerStatus(workerId, action) {
        const worker = await workerRepository.findById(workerId);
        if (!worker) {
            throw new Error('Worker not found');
        }

        switch (action) {
            case 'active':
                await workerRepository.updateLastSeen(workerId);
                break;
            case 'offline':
                await workerRepository.updateStatus(workerId, 'offline');
                break;
            case 'remove':
                await workerRepository.delete(workerId);
                return { removed: true };
            default:
                throw new Error('Invalid action');
        }

        const updatedWorker = await workerRepository.updateStatus(workerId, 'online');
        return updatedWorker ? updatedWorker.toJSON() : null;
    }

    async updateActivity(workerId) {
        const worker = await workerRepository.updateLastSeen(workerId);
        if (!worker) {
            throw new Error('Worker not found');
        }
        return worker.toJSON();
    }

    async checkWorkerOnline(workerId) {
        const worker = await workerRepository.findById(workerId);
        if (!worker) return false;
        
        const isOnline = worker.status === 'online';
        const lastSeen = worker.lastSeen;
        const isRecent = lastSeen && (new Date() - new Date(lastSeen)) < 60000;
        
        return isOnline && isRecent;
    }

    async getWorkerForTask(workerId) {
        const worker = await workerRepository.findById(workerId);
        if (!worker) throw new Error('Worker not found');
        
        const isOnline = worker.status === 'online';
        const lastSeen = worker.lastSeen;
        const isRecent = lastSeen && (new Date() - new Date(lastSeen)) < 60000;
        
        if (!isOnline || !isRecent) {
            throw new Error('Worker is offline or not responding');
        }
        
        return worker;
    }

    async updateWorker(workerId, workerData) {
        const worker = await workerRepository.update(workerId, workerData);
        if (!worker) throw new Error('Worker not found');
        return worker.toJSON();
    }

    async deleteWorker(workerId) {
        const deleted = await workerRepository.delete(workerId);
        if (!deleted) throw new Error('Worker not found');
        return true;
    }

    async getOnlineWorkers() {
        const workers = await workerRepository.findOnline();
        return workers.map(w => w.toJSON());
    }

    async getWorkerHeartbeats(workerId) {
        return await workerRepository.findHeartbeats(workerId);
    }
}

module.exports = new WorkerService();