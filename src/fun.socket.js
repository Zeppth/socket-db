import WebSocket from 'ws';
import crypto from 'crypto';
import { EventEmitter } from 'events';

export class WebSocketDB extends EventEmitter {
    constructor(url, {
        maxAttempts = 10,
        initialReconnectDelay = 1000,
        maxReconnectDelay = 30000
    } = {}) {
        super();
        this.url = url;
        this.Id = new Map();
        this.connPromise = Promise.resolve();
        this.initialReconnectDelay = initialReconnectDelay;
        this.maxReconnectDelay = maxReconnectDelay;
        this.maxAttempts = maxAttempts;
        this.setupInitialConnection();
        this.state = {
            reconnecting: false,
            AttemptsCount: 0,
        };
    }
    async setupInitialConnection() {
        try { await (this.connPromise = this.makeConn()) }
        catch (e) { }
    }
    makeConn() {
        return new Promise((resolve, reject) => {
            try {
                this.webSocket = new WebSocket(this.url);
                this.setupEvents(resolve, reject);
            } catch (e) {
                const errorData = {
                    type: 'websocket_creation_error',
                    message: 'Error creating WebSocket: ' + e.message,
                    details: e.message,
                };
                this.emit('error', errorData);
                this.reconnect(errorData);
                reject(errorData);
            }
        });
    }

    setupEvents(resolve, reject) {
        this.webSocket.once('open', async () => {
            this.state = {
                reconnecting: false,
                AttemptsCount: 0,
            };
            this.emit('connected');
            resolve();
        });

        this.webSocket.on('message', (m) => {
            let data = m.toString();
            try { data = JSON.parse(data); }
            catch (e) { data = undefined; }
            if (data && this.Id.has(data.id))
                this.Id.get(data.id)(data);
            this.emit('messages', data)
        });

        this.webSocket.on('close', () => {
            this.emit('disconnected');
            const errorData = {
                type: 'websocket_closed',
                message: 'WebSocket closed unexpectedly',
            };
            this.reconnect(errorData);
            reject(errorData);
        });

        this.webSocket.on('error', (e) => {
            let errorData;
            if (e.message.includes('ECONNREFUSED')) {
                errorData = {
                    type: 'connection_error',
                    message: 'Connection refused by the server',
                    details: e.message,
                    code: 'ECONNREFUSED'
                };
            } else errorData = {
                type: 'websocket_error',
                message: 'WebSocket error: ' + e.message,
                details: e.message
            };

            this.emit('error', errorData);
            this.reconnect(errorData);
            reject(errorData);
        });
    }

    reconnect(errorData) {
        if (this.state.reconnecting) return;

        if (this.state.AttemptsCount >= this.maxAttempts) {
            this.state.reconnecting = false;
            this.emit('error', {
                type: 'max_reconnect_attempts',
                message: `Max reconnection attempts reached (${this.maxAttempts}).`,
                ...errorData
            });
            return;
        }
        this.state.reconnecting = true;
        this.state.AttemptsCount += 1;

        const delay = Math.min(
            this.initialReconnectDelay *
            Math.pow(2, this.state.AttemptsCount - 1),
            this.maxReconnectDelay,
        );
        this.emit('reconnecting', { attempt: this.state.AttemptsCount, delay });

        setTimeout(async () => {
            this.state.reconnecting = false;
            try { await (this.connPromise = this.makeConn()) }
            catch (e) { }
        }, delay);
    }

    async send(database, type, objects, timeout = 10000) {
        try {
            await this.connPromise;
        } catch (e) {
            this.emit('error', e)
            return Promise.reject(e);
        }

        if (this.webSocket.readyState !== WebSocket.OPEN) {
            const errorData = {
                type: 'websocket_not_open',
                message: 'WebSocket not connected',
            };
            this.emit('error', errorData);
            return Promise.reject(errorData);
        }

        return new Promise((resolve, reject) => {
            const requestId = crypto
                .randomBytes(8)
                .toString('hex')
                .toUpperCase();

            const timeoutId = setTimeout(() => {
                const errorData = {
                    type: 'request_timeout',
                    message: 'Request timed out',
                    details: `Request timed out after ${timeout / 1000} seconds`,
                };
                this.Id.delete(requestId);
                this.emit('error', errorData);
                reject(errorData);
            }, timeout);

            this.Id.set(requestId, (response) => {
                clearTimeout(timeoutId);
                resolve(response);
            });

            this.webSocket.send(JSON.stringify({
                ...objects,
                id: requestId,
                database,
                type,
            }));
        });
    }
}