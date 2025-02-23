import http from 'http';
import { WebSocketServer } from 'ws';
import { FunLowDB } from './fun.lowdb.js';
import { EventEmitter } from 'events';
import crypto from 'crypto';

const users = new Map();
const randomId = (number) => crypto
    .randomBytes(number)
    .toString('hex')
    .toUpperCase();

export class createServerDB {
    constructor({
        port = 8080,
        folder = 'data'
    }) {
        this.port = port;
        this.ev = new EventEmitter()
        this.server = http.createServer();
        this.lowdb = new FunLowDB(folder)
        this.load = async () =>
            await this.lowdb.load()
        this.WebSocket = new WebSocketServer({
            server: this.server
        });

        this.WebSocket.on('connection', (socket) => {
            socket.id = randomId(6);
            users.set(socket.id, socket);

            this.ev.emit('connection', {
                type: 'user-connected',
                user_id: socket.id
            })

            socket.on('close', () => {
                users.delete(socket.id);
                this.ev.emit('connection', {
                    type: 'user-disconnected',
                    user_id: socket.id
                })
            });

            socket.on('message', async (data) => {
                try {
                    data = JSON.parse(data.toString());
                } catch (e) {
                    const message = JSON.stringify({
                        error: e.message,
                        status: false
                    });
                    socket.send(message);
                    this.ev.emit('error', {
                        type: 'parse-error',
                        user_id: socket.id,
                        error: e.message
                    });
                    return;
                }

                const reply = (message) => {
                    if (data.id) message.id = data.id;
                    socket.send(JSON.stringify(message));
                };

                this.ev.emit('message', {
                    type: 'user-message',
                    user_id: socket.id,
                    input: { ...data }
                });


                try {
                    switch (data.type) {
                        case 'create-db': {
                            const status = await this.lowdb
                                .create(data.database, data.payload?.[0] || {});
                            reply({ status });
                        } break;

                        case 'delete-db': {
                            const status = await this.lowdb.delete(data.database);
                            reply({ status });
                        } break;

                        case 'get': {
                            const db = await this.lowdb.db(data.database);
                            if (!db) return reply({ status: false, error: 'Database does not exist' });
                            reply({ status: true, data: db.get(...data.payload).data });
                        } break;

                        case 'has': {
                            const db = await this.lowdb.db(data.database);
                            if (!db) return reply({ status: false, error: 'Database does not exist' });
                            reply({ status: true, data: db.has(...data.payload).data });
                        } break;

                        case 'assign': {
                            const db = await this.lowdb.db(data.database);
                            if (!db) return reply({ status: false, error: 'Database does not exist' });
                            reply({ status: true, data: db.assign(...data.payload).data });
                            await db.write();
                        } break;

                        case 'set': {
                            const db = await this.lowdb.db(data.database);
                            if (!db) return reply({ status: false, error: 'Database does not exist' });
                            reply({ status: true, data: db.set(...data.payload).data });
                            await db.write();
                        } break;

                        case 'delete': {
                            const db = await this.lowdb.db(data.database);
                            if (!db) return reply({ status: false, error: 'Database does not exist' });
                            reply({ status: true, data: db.delete(...data.payload).data });
                            await db.write();
                        } break;

                        case 'chain': {
                            let func = '740';
                            const db = await this.lowdb.db(data.database);
                            if (!db) return reply({ status: false, error: 'Database does not exist' });
                            for (const o of data.chain) {
                                if (!o.type || !Array.isArray(o.payload)) {
                                    const errorMsg = 'Invalid request structure';
                                    reply({ status: false, error: errorMsg });
                                    return this.ev.emit('error', {
                                        type: 'chain-error',
                                        user_id: socket.id,
                                        error: errorMsg
                                    })
                                }

                                if (!db[o.type]) {
                                    const errorMsg = `Invalid method: ${o.type}`;
                                    reply({ status: false, error: errorMsg });
                                    return this.ev.emit('error', {
                                        type: 'chain-error',
                                        user_id: socket.id,
                                        error: errorMsg
                                    })
                                }

                                if (func === '740') {
                                    if (typeof db[o.type] === 'function') {
                                        func = db[o.type](...o.payload);
                                    } else {
                                        const errorMsg = `Method ${o.type} not found in database`;
                                        reply({ status: false, error: errorMsg });
                                        this.ev.emit('error', {
                                            type: 'chain-error',
                                            user_id: socket.id,
                                            error: errorMsg
                                        });
                                        return;
                                    }
                                } else {
                                    if (typeof func[o.type] === 'function') {
                                        func = func[o.type](...o.payload);
                                    } else {
                                        const errorMsg = `Method ${o.type} not found in result`;
                                        reply({ status: false, error: errorMsg });
                                        this.ev.emit('error', {
                                            type: 'chain-error',
                                            user_id: socket.id,
                                            error: errorMsg
                                        });
                                        return;
                                    }
                                }
                                if (['set', 'assign', 'delete'].includes(o.type)) {
                                    await db.write();
                                }
                            }
                            reply({ result: func.data ? func.data : func });
                        } break;

                        default: {
                            const errorMsg = 'Invalid request type';
                            reply({ status: false, error: errorMsg });
                            this.ev.emit('error', {
                                type: 'request-type-error',
                                user_id: socket.id,
                                error: errorMsg
                            });
                        }
                    }
                } catch (e) {
                    reply({
                        status: false,
                        error: e
                    });
                    this.ev.emit('error', {
                        type: 'unhandled-error',
                        user_id: socket.id,
                        error: errorMsg
                    })
                }
            });
        });

        this.server.on('error', (error) => {
            this.ev.emit('server-error', {
                type: 'server-error',
                error: error.message
            });
        });


        this.server.listen(this.port, () => {
            this.ev.emit('running', {
                port: this.port
            });
        });
    }

    send(user, data) {
        if (!user) return 'userId_undefined'
        if (!data) return 'data_undefined'
        const _data = JSON.stringify(data)
        const _user = users.get(user)
        return _user.send(_data)
    }
}