const { EventEmitter } = require('events');
const { v4: uuidv4 } = require('uuid');

/**
 * BrainWebSocketBridge
 * -----------------------------------------------------------
 * Maintains a persistent WebSocket connection from Node.js API
 * to the Python FastAPI Brain (/ws/node-bridge).
 *
 * Usage:
 *   const bridge = require('./brainWebSocketBridge');
 *   await bridge.initialize(io);          // call once on server start
 *   const result = await bridge.send('orchestrate', {});
 *   const aiStatus = await bridge.send('check-ai', {});
 */

class BrainWebSocketBridge extends EventEmitter {
    constructor() {
        super();
        this.ws = null;
        this.io = null; // Socket.IO instance for pushing to dashboard
        this.isConnected = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 20;
        this.reconnectDelay = 3000;      // start at 3 s
        this.maxReconnectDelay = 60000;  // cap at 60 s
        this.pendingJobs = new Map();    // job_id → { resolve, reject, timeout }
        this.jobTimeout = 300000;        // 5 min per job max
        this.brainUrl = process.env.BRAIN_WS_URL || 'ws://localhost:8000/ws/node-bridge';
        this._reconnectTimer = null;
        this._pingInterval = null;
    }

    /**
     * Initialize the bridge and store Socket.IO reference.
     */
    async initialize(io) {
        this.io = io;
        console.log(`🧠 BrainBridge: Initialized. Waiting for Brain client via Socket.IO`);
        this.isConnected = false;
    }

    setBrainSocket(socket) {
        this.ws = socket;
        this.isConnected = true;
        console.log(`✅ BrainBridge: Brain socket registered (${socket.id})`);
        if (this.io) {
            this.io.emit('brain:status', { connected: true });
        }
    }

    clearBrainSocket(socket) {
        if (this.ws === socket) {
            this.ws = null;
            this.isConnected = false;
            console.log(`❌ BrainBridge: Brain socket disconnected`);
            if (this.io) {
                this.io.emit('brain:status', { connected: false });
            }
        }
    }

    handleBrainResponse(msg) {
        const { job_id, type, data, error } = msg;

        // Push ALL brain events to the dashboard via Socket.IO
        if (this.io) {
            this.io.emit('brain:result', msg);
        }

        if (!job_id) return;

        const pending = this.pendingJobs.get(job_id);
        if (!pending) return;

        clearTimeout(pending.timeout);
        this.pendingJobs.delete(job_id);

        if (type === 'error' || error) {
            pending.reject(new Error(error || 'Brain returned an error'));
        } else {
            pending.resolve(data);
        }
    }

    // ─── Public API ────────────────────────────────────────────

    /**
     * Send a job to the Brain and await the result.
     * @param {string} type  - 'orchestrate' | 'check-ai' | 'generate-prompt'
     * @param {object} payload - additional data (e.g. { url } for generate-prompt)
     * @returns {Promise<object>}
     */
    send(type, payload = {}) {
        return new Promise((resolve, reject) => {
            if (!this.isConnected || !this.ws) {
                return reject(new Error('Brain is not connected'));
            }

            const job_id = uuidv4();

            const timeoutHandle = setTimeout(() => {
                this.pendingJobs.delete(job_id);
                reject(new Error(`Brain job "${type}" timed out after ${this.jobTimeout / 1000}s`));
            }, this.jobTimeout);

            this.pendingJobs.set(job_id, { resolve, reject, timeout: timeoutHandle });

            try {
                this.ws.emit('brain:command', { job_id, type, ...payload });
            } catch (err) {
                clearTimeout(timeoutHandle);
                this.pendingJobs.delete(job_id);
                reject(new Error(`Failed to emit command to Brain: ${err.message}`));
            }
        });
    }

    /** Returns current connection status */
    status() {
        return {
            connected: this.isConnected,
            brainUrl: 'inward Socket.IO connection',
            pendingJobs: this.pendingJobs.size,
            reconnectAttempts: 0,
        };
    }
}

// Singleton — one bridge per Node.js process
const brainBridge = new BrainWebSocketBridge();
module.exports = brainBridge;
