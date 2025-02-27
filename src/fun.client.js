import { Socket } from "./fun.socket.js"

export class SocketClient extends Socket {
    constructor({ url = '', password = '' }) {
        super(url, password)
    }

    async createDB(name, payload) {
        return await this.send({ database: name, type: 'create-db', payload })
    }

    async deleteDB(name, payload) {
        return await this.send({ database: name, type: 'delete-db', payload })
    }

    dataBase(name) {
        const that = this
        return {
            async send(type, payload) {
                return await that.send({
                    ...payload, database: name, type: type
                })
            },
            async get(...payload) {
                return await this.send('get', { payload })
            },
            async set(...payload) {
                return await this.send('set', { payload })
            },
            async has(...payload) {
                return await this.send('has', { payload })
            },
            async assign(...payload) {
                return await this.send('assign', { payload })
            },
            async delete(...payload) {
                return await this.send('delete', { payload })
            },
            get chain() {
                const chain = (format) => ({
                    get: (...payload) => {
                        format.chain.push({ type: 'get', payload });
                        return chain(format);
                    },
                    set: (...payload) => {
                        format.chain.push({ type: 'set', payload });
                        return chain(format);
                    },
                    has: (...payload) => {
                        format.chain.push({ type: 'has', payload });
                        return chain(format);
                    },
                    assign: (...payload) => {
                        format.chain.push({ type: 'assign', payload });
                        return chain(format);
                    },
                    delete: (...payload) => {
                        format.chain.push({ type: 'delete', payload });
                        return chain(format);
                    },
                    run: async () => {
                        const output = await this.send(format.type,
                            { chain: format.chain })
                        format.chain = []
                        return output
                    }
                })

                return {
                    get: (...payload) => chain({
                        type: 'chain', database: name,
                        chain: [{ type: 'get', payload }]
                    }),
                    set: (...payload) => chain({
                        type: 'chain', database: name,
                        chain: [{ type: 'set', payload }]
                    }),
                    has: (...payload) => chain({
                        type: 'chain', database: name,
                        chain: [{ type: 'has', payload }]
                    }),
                    assign: (...payload) => chain({
                        type: 'chain', database: name,
                        chain: [{ type: 'assign', payload }]
                    }),
                    delete: (...payload) => chain({
                        type: 'chain', database: name,
                        chain: [{ type: 'delete', payload }]
                    }),
                }
            }
        }
    }
}