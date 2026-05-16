class WorkerModel {
    constructor(data) {
        this.id = data.id;
        this.workerId = data.worker_id;
        this.nickname = data.nickname;
        this.machineId = data.machine_id;
        this.systemIp = data.system_ip;
        this.osPlatform = data.os_platform;
        this.status = data.status;
        this.lastSeen = data.last_seen;
        this.createdAt = data.created_at;
        this.updatedAt = data.updated_at;
    }

    isOnline() {
        if (this.status !== 'online') return false;
        if (!this.lastSeen) return false;
        const sixtySecondsAgo = new Date(Date.now() - 60000);
        return new Date(this.lastSeen) > sixtySecondsAgo;
    }

    toJSON() {
        return {
            id: this.id,
            worker_id: this.workerId,
            nickname: this.nickname,
            machine_id: this.machineId,
            system_ip: this.systemIp,
            os_platform: this.osPlatform,
            status: this.status,
            last_seen: this.lastSeen,
            created_at: this.createdAt,
            updated_at: this.updatedAt,
            is_online: this.isOnline()
        };
    }
}

module.exports = WorkerModel;