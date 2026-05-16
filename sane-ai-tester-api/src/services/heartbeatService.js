const workerRepository = require('../repositories/workerRepository');

class HeartbeatService {
    constructor() {
        this.interval = null;
        this.callback = null;
    }

    start(callback) {
        this.callback = callback;
        
        // Initial run
        this.check();
        
        // Run every 10 seconds
        this.interval = setInterval(() => this.check(), 10000);
        console.log('⏰ Heartbeat service started (checks every 10s)');
    }

    async check() {
        try {
            const offlineWorkers = await workerRepository.markOfflineInactive();
            
            if (offlineWorkers.length > 0) {
                console.log(`🔄 Auto-offline: ${offlineWorkers.map(w => `${w.nickname} (${w.worker_id})`).join(', ')}`);
                
                if (this.callback) {
                    this.callback(offlineWorkers);
                }
            }
        } catch (err) {
            console.error('❌ Auto-offline error:', err);
        }
    }

    stop() {
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
    }
}

module.exports = new HeartbeatService();