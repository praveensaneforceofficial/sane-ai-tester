const axios = require('axios');
const config = require('../utils/config');
const logger = require('../utils/logger');

class APIClient {
    constructor() {
        this.baseUrl = config.API_URL;
    }

    async registerWorker(workerId, nickname, specs) {
        try {
            logger.info(`Registering worker ${workerId} (${nickname}) with central API...`);
            const response = await axios.post(`${this.baseUrl}/api/workers/register`, {
                workerId,
                nickname,
                specs: specs || {}
            });
            return response.data;
        } catch (err) {
            logger.error(`Failed to register worker: ${err.message}`);
            throw err;
        }
    }

    async updateStatus(workerId, status) {
        try {
            const response = await axios.post(`${this.baseUrl}/api/workers/status`, {
                workerId,
                status
            });
            return response.data;
        } catch (err) {
            logger.error(`Failed to update status: ${err.message}`);
            return null;
        }
    }
}

module.exports = new APIClient();
