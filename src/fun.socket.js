import WebSocket from 'ws';
import crypto from 'crypto';
import { EventEmitter } from 'events';

const ERROR_TYPES = {
    WEBSOCKET_CREATION_ERROR: 'websocket_creation_error',
    AUTHENTICATION_ERROR: 'authentication_error',
    WEBSOCKET_NOT_OPEN: 'websocket_not_open',
    REQUIRE_PASSWORD: 'require_password',
    WEBSOCKET_CLOSED: 'websocket_closed',
    INVALID_MESSAGE: 'invalid_message',
    WEBSOCKET_ERROR: 'websocket_error',
    REQUEST_TIMEOUT: 'request_timeout',
    RECONNECTING: 'reconnecting',
    SEND_ERROR: 'send_error',
};

export class Socket {
    constructor(url, password) {
        this.ev = new EventEmitter();
        this.reconnDelay = 1000;
        this.maxReconnDelay = 30000;
        this.reconnecting = false;
        this.webSocket = null;
        this.status = 'close';
        this.Id = new Map();
        this.url = url;
        this.password = password;
        this.reconn = false;
    }


    async start() {
        return await this._socket.start(async (resolve) => {
            this.webSocket.once('open', async () => {
                this.reconnDelay = 1000;
                this.status = 'open';

                const require_password =
                    (await this.send({
                        type: 'verify-password'
                    })).require

                if (require_password &&
                    !this.password) {
                    const error = {};
                    error.type = ERROR_TYPES.REQUIRE_PASSWORD;
                    error.message = 'Require_password';
                    this.ev.emit('error', error);
                    resolve();
                }

                this.require_password = require_password;

                if (typeof this.password === 'string' &&
                    this.require_password) {
                    try {
                        const send = {};
                        send.type = 'password';
                        send.payload = [this.password];
                        const result = await this.send(send);
                        if (result.status !== true)
                            return this._socket.retry();
                    } catch (e) {
                        const error = {};
                        error.type = ERROR_TYPES.AUTHENTICATION_ERROR;
                        error.message = 'Error during authentication';
                        error.details = e.message || e;
                        this.ev.emit('error', error);
                        return this._socket.retry();
                    }
                }


                this.ev.emit('connection', {
                    type: 'open'
                });
                this.reconn = false;
                resolve();
            });


            this.webSocket.on('close', () => {
                this.status = 'close';
                this.Id.forEach((callback, id) => {
                    const errorData = {};
                    errorData.type = ERROR_TYPES.WEBSOCKET_CLOSED;
                    errorData.message = 'WebSocket closed unexpectedly';
                    callback({ ...errorData, id });
                });
                this.Id.clear();

                const error = {};
                error.type = ERROR_TYPES.WEBSOCKET_CLOSED;
                error.message = 'WebSocket closed unexpectedly';
                this.ev.emit('error', error);
                this._socket.retry();
            });

            this.webSocket.on('message', (message) => {
                message = message.toString()

                try {
                    const data = JSON.parse(message);
                    this.ev.emit('message', data)
                    if (data.id && this.Id.has(data.id)) {
                        const callback = this.Id.get(data.id);
                        this.Id.delete(data.id);
                        callback(data);
                    }
                } catch (err) {
                    const error = {};
                    error.type = ERROR_TYPES.INVALID_MESSAGE;
                    error.message = 'Received invalid message';
                    error.details = err.message || err;
                    this.ev.emit('error', error);
                }
            })
        })
    }


    close() {
        return this._socket.close();
    }

    async send(objects, timeout = 10000) {
        if (!this.webSocket || this.webSocket.readyState !== WebSocket.OPEN) {
            const errorData = { type: ERROR_TYPES.WEBSOCKET_NOT_OPEN };
            errorData.message = 'WebSocket not connected';
            this.ev.emit('error', errorData);
            return Promise.reject(errorData);
        }

        return new Promise((resolve, reject) => {
            const requestId = crypto.randomBytes(8)
                .toString('hex').toUpperCase();

            const timeoutId = setTimeout(() => {
                this.Id.delete(requestId);
                const errorData = { type: ERROR_TYPES.REQUEST_TIMEOUT };
                errorData.details = `Request timed out after ${timeout / 1000} s`;
                errorData.message = 'Request timed out';
                this.ev.emit('error', errorData);
                reject(errorData);
            }, timeout);

            this.Id.set(requestId, (response) => {
                clearTimeout(timeoutId);
                resolve(response);
            });

            try {
                this.webSocket.send(JSON.stringify({
                    ...objects, id: requestId
                }));
            } catch (sendError) {
                clearTimeout(timeoutId);
                this.Id.delete(requestId);
                const errorData = { type: ERROR_TYPES.SEND_ERROR };
                errorData.details = sendError.message || sendError;
                errorData.message = 'Error sending message';
                this.ev.emit('error', errorData);
                reject(errorData);
            }
        });
    }

    get _socket() {
        const that = this;
        return {
            start: async (fun) => {
                if (that.status === 'open') return;
                if (!that.reconn) that.reconn = true;
                else return;

                return new Promise(async (resolve) => {
                    try {
                        that.webSocket = new WebSocket(that.url)
                        that.webSocket.on('error', (e) => {
                            const error = {};
                            error.type = ERROR_TYPES.WEBSOCKET_ERROR;
                            error.message = 'WebSocket connection error';
                            error.details = e.message || e;
                            that.ev.emit('error', error);
                            that._socket.retry();
                        });
                        await fun(resolve)
                    } catch (e) {
                        const error = {};
                        error.type = ERROR_TYPES.WEBSOCKET_CREATION_ERROR;
                        error.message = 'Error creating WebSocket';
                        error.details = e.message || e;
                        that.ev.emit('error', error);
                        that._socket.retry();
                    }
                })
            },
            close: () => {
                if (!that.webSocket) return
                that.webSocket.close();
                that.webSocket = null;
                that.status = 'close'
            },
            retry: () => {
                that.status = 'close';
                that.reconn = false
                that.reconnDelay = Math.min(
                    that.reconnDelay * 2,
                    that.maxReconnDelay);

                setTimeout(() => {
                    const error = {};
                    error.type = ERROR_TYPES.RECONNECTING;
                    error.message = `Reconnecting in ${that.reconnDelay / 1000} seconds...`;
                    that.ev.emit('error', error);
                    that.start();
                }, that.reconnDelay);
            }
        }
    }
}