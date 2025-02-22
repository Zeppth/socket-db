import lodash from 'lodash';
import { JSONFile } from 'lowdb/node';
import { Low } from 'lowdb';
import path from 'path';
import fs from 'fs';

export const DB = new Map();

export class LowDB extends Low {
    constructor(object = {}) {
        if (!object || !object.filename)
            throw new Error('lowdb: filename is required');
        super(new JSONFile(object.filename),
            object.defaultData || {});
        this.read();
    }
    async write(data) {
        if (JSON.stringify(this.data) !==
            JSON.stringify(await this.adapter.read())) {
            await this.adapter.write(data ?? this.data);
        }
    }
}

export class FunLowDB {
    constructor(folderPath) {
        this.databases = new Map()
        this.folder = path.resolve(folderPath)
    }

    async create(name, value) {
        if (this.databases.has(name)) return false
        if (!/^[a-zA-Z0-9_-]+$/.test(name)) return false
        const filePath = `${this.folder}/${name}.json`
        const db = new LowDB({
            defaultData: value || {},
            filename: filePath
        });

        await db.write();
        this.databases.set(name, {
            ...db, write: (data) =>
                db.write(data)
        });
        return true;
    }

    async delete(name) {
        if (this.databases.has(name)) return false
        const filePath = `${this.folder}/${name}.json`
        try {
            await fs.promises.unlink(filePath);
            this.databases.delete(name);
            return true;
        } catch (e) {
            console.error(`delete[error]:${name}:`, e);
            return false;
        }
    }

    db(name) {
        if (!name) return false;
        const db = this.databases.get(name);
        if (!db) return false;

        const funs = {
            has: (path) => {
                if (!path) return false
                return lodash.has(db.data, path)
            },
            get: (path) => {
                if (!path) return db.data;
                return lodash.get(db.data, path);
            },
            delete: (path) => {
                if (!path) return;
                lodash.unset(db.data, path);
                return true;
            },
            set: (path, value) => {
                if (!path || !value) return;
                lodash.set(db.data, path, value);
                return true;
            },
            assign: (path, value) => {
                if (!path || !value) return;
                const lodGet = lodash.get(db.data, path);
                if (typeof lodGet === 'object') {
                    lodash.merge(lodGet, value);
                } else lodash.set(db.data, path, value);
                lodash.assign()
                return true;
            }
        }

        function fun(path) {
            let $path = path
            return {
                get: (path) => {
                    $path = ($path
                        ? `${$path}.${path}` : path)
                    return {
                        data: funs.get($path),
                        ...fun($path)
                    }
                },
                has: (path, boolean = true) => {
                    const has = funs.has($path
                        ? `${$path}.${path}` : path)
                    if (boolean == has) return fun($path)
                    else return false
                },
                set: (path, value) => {
                    funs.set($path
                        ? `${$path}.${path}`
                        : path, value)
                    return fun($path)
                },
                assign: (path, value) => {
                    funs.assign($path
                        ? `${$path}.${path}`
                        : path, value)
                    return fun($path)
                },
                delete: (path) => {
                    funs.delete($path
                        ? `${$path}.${path}` : path)
                    return fun($path)
                }
            }
        }

        return {
            ...db,
            get: (path) =>
                fun().get(path),
            has: (path, value) =>
                fun().has(path, value),
            set: (path, value) =>
                fun().set(path, value),
            assign: (path, value) =>
                fun().assign(path, value),
            delete: (path) =>
                fun().delete(path)
        }
    }
}

export const lowdb = {
    async createDB(name, value) {
        if (DB.has(name)) return false
        if (!/^[a-zA-Z0-9_-]+$/.test(name)) return false
        const filePath = path.resolve(`./storage/${name}.json`);
        const db = new LowDB({
            defaultData: value || {},
            filename: filePath
        });

        await db.write();
        DB.set(name, {
            ...db,
            write: (data) =>
                db.write(data)
        });
        return true;
    },
    async deleteDB(name) {
        if (!DB.has(name)) return false;
        const filePath = path.resolve(`./storage/${name}.json`);
        try {
            await fs.promises
                .unlink(filePath);
            DB.delete(name);
            return true;
        } catch (e) {
            console.error(`delete[error]:${name}:`, e);
            return false;
        }
    },

    getDB(name) {
        if (!name) return false;
        const db = DB.get(name);
        if (!db) return false;

        const funs = {
            has: (path) => {
                if (!path) return false
                return lodash.has(db.data, path)
            },
            get: (path) => {
                if (!path) return db.data;
                return lodash.get(db.data, path);
            },
            delete: (path) => {
                if (!path) return;
                lodash.unset(db.data, path);
                return true;
            },
            set: (path, value) => {
                if (!path || !value) return;
                lodash.set(db.data, path, value);
                return true;
            },
            assign: (path, value) => {
                if (!path || !value) return;
                const lodGet = lodash.get(db.data, path);
                if (typeof lodGet === 'object') {
                    lodash.merge(lodGet, value);
                } else lodash.set(db.data, path, value);
                lodash.assign()
                return true;
            }
        }

        function fun(path) {
            let $path = path
            return {
                get: (path) => {
                    $path = ($path
                        ? `${$path}.${path}` : path)
                    return {
                        data: funs.get($path),
                        ...fun($path)
                    }
                },
                has: (path, boolean = true) => {
                    const has = funs.has($path
                        ? `${$path}.${path}` : path)
                    if (boolean == has) return fun($path)
                    else return false
                },
                set: (path, value) => {
                    funs.set($path
                        ? `${$path}.${path}`
                        : path, value)
                    return fun($path)
                },
                assign: (path, value) => {
                    funs.assign($path
                        ? `${$path}.${path}`
                        : path, value)
                    return fun($path)
                },
                delete: (path) => {
                    funs.delete($path
                        ? `${$path}.${path}` : path)
                    return fun($path)
                }
            }
        }

        return {
            ...db,
            get: (path) =>
                fun().get(path),
            has: (path, value) =>
                fun().has(path, value),
            set: (path, value) =>
                fun().set(path, value),
            assign: (path, value) =>
                fun().assign(path, value),
            delete: (path) =>
                fun().delete(path)
        }
    }
};    