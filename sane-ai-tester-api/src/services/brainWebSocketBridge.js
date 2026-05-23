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
     * Call this once from server.js after io is created.
     */
    async initialize(io) {
        this.io = io;
        console.log(`🧠 BrainBridge: Initializing connection to ${this.brainUrl}`);
        this._connect();
    }

    // ─── Internal WebSocket lifecycle ─────────────────────────

    _connect() {
        // Lazy-require 'ws' — bundled with most Node environments
        let WebSocket;
        try {
            WebSocket = require('ws');
        } catch (_) {
            console.error('❌ BrainBridge: "ws" package not installed. Run: npm install ws');
            return;
        }

        try {
            this.ws = new WebSocket(this.brainUrl);
        } catch (err) {
            console.error('❌ BrainBridge: Failed to create WebSocket:', err.message);
            this._scheduleReconnect();
            return;
        }

        this.ws.on('open', () => {
            this.isConnected = true;
            this.reconnectAttempts = 0;
            this.reconnectDelay = 3000;
            console.log('✅ BrainBridge: Connected to Python Brain');
            this._startPing();
            if (this.io) {
                this.io.emit('brain:status', { connected: true });
            }
        });

        this.ws.on('message', (raw) => {
            this._handleMessage(raw);
        });

        this.ws.on('close', (code, reason) => {
            this.isConnected = false;
            this._stopPing();
            console.warn(`⚠️  BrainBridge: Connection closed (${code}). Reconnecting…`);
            if (this.io) {
                this.io.emit('brain:status', { connected: false });
            }
            this._scheduleReconnect();
        });

        this.ws.on('error', (err) => {
            // 'close' will fire after 'error', so just log here
            console.error('❌ BrainBridge: WebSocket error:', err.message);
        });
    }

    _scheduleReconnect() {
        if (this._reconnectTimer) return; // already scheduled
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.error('❌ BrainBridge: Max reconnect attempts reached. Giving up.');
            return;
        }
        this.reconnectAttempts++;
        const delay = Math.min(
            this.reconnectDelay * Math.pow(1.5, this.reconnectAttempts - 1),
            this.maxReconnectDelay
        );
        console.log(`🔄 BrainBridge: Reconnect attempt ${this.reconnectAttempts} in ${Math.round(delay / 1000)}s`);
        this._reconnectTimer = setTimeout(() => {
            this._reconnectTimer = null;
            this._connect();
        }, delay);
    }

    _startPing() {
        this._pingInterval = setInterval(() => {
            if (this.ws && this.ws.readyState === 1 /* OPEN */) {
                this.ws.ping?.();
            }
        }, 30000);
    }

    _stopPing() {
        if (this._pingInterval) {
            clearInterval(this._pingInterval);
            this._pingInterval = null;
        }
    }

    // ─── Message handling ──────────────────────────────────────

    _handleMessage(raw) {
        let msg;
        try {
            msg = JSON.parse(raw.toString());
        } catch (_) {
            console.warn('⚠️  BrainBridge: Received non-JSON message');
            return;
        }

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
            if (!this.isConnected || !this.ws || this.ws.readyState !== 1) {
                return reject(new Error('Brain WebSocket is not connected'));
            }

            const job_id = uuidv4();
            const message = JSON.stringify({ job_id, type, ...payload });

            const timeoutHandle = setTimeout(() => {
                this.pendingJobs.delete(job_id);
                reject(new Error(`Brain job "${type}" timed out after ${this.jobTimeout / 1000}s`));
            }, this.jobTimeout);

            this.pendingJobs.set(job_id, { resolve, reject, timeout: timeoutHandle });

            this.ws.send(message, (err) => {
                if (err) {
                    clearTimeout(timeoutHandle);
                    this.pendingJobs.delete(job_id);
                    reject(new Error(`Failed to send to Brain: ${err.message}`));
                }
            });
        });
    }

    /** Returns current connection status */
    status() {
        return {
            connected: this.isConnected,
            brainUrl: this.brainUrl,
            pendingJobs: this.pendingJobs.size,
            reconnectAttempts: this.reconnectAttempts,
        };
    }
}

// Singleton — one bridge per Node.js process
const brainBridge = new BrainWebSocketBridge();
module.exports = brainBridge;
