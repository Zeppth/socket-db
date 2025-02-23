import { WebSocketDB } from "./fun.socket.js"

export class connServerDB {
    constructor(url) {
        this.socket = new WebSocketDB(url)
        this.ev = this.socket
    }

    async createDB(name, payload) {
        await this.socket.send(name, 'create-db', { payload })
    }

    async deleteDB(name, payload) {
        await this.socket.send(name, 'delete-db', { payload })
    }

    dataBase(name) {
        return {
            send: async (type, payload) =>
                await this.socket.send(name, type, payload),
            get: async (...payload) =>
                await this.socket.send(name, 'get', { payload }),
            set: async (...payload) =>
                await this.socket.send(name, 'set', { payload }),
            has: async (...payload) =>
                await this.socket.send(name, 'has', { payload }),
            assign: async (...payload) =>
                await this.socket.send(name, 'assign', { payload }),
            delete: async (...payload) =>
                await this.socket.send(name, 'delete', { payload }),
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