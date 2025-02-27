import lodash from 'lodash';
import { JSONFile } from 'lowdb/node';
import { Low } from 'lowdb';
import path from 'path';
import fs from 'fs';

import {
    access,
    randomId,
    createJSON
} from './fun.utils.js';

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
        this.folder = folderPath
        this.resfolder = path.resolve(folderPath)
        if (!fs.existsSync(this.folder)) {
            fs.mkdirSync(this.folder, { recursive: true });
        }
    }

    async load() {
        try {
            const files = await fs.promises
                .readdir(this.resfolder);
            await Promise.all(files.map(async (file) => {
                if (!file.endsWith('.info.json')) return;
                const _path = path.join(this.resfolder, file);
                const _File = await fs.promises.readFile(_path, 'utf-8');
                const parse = JSON.parse(_File);
                const pathDB = path.resolve(parse.database);

                if (await access(pathDB)) {
                    const db = new LowDB({
                        defaultData: {},
                        filename: pathDB
                    });
                    await db.read()
                    this.databases.set(parse.databaseName, {
                        ...parse, ...db,
                        write: () => db.write()
                    });
                }
            }))
        } catch (e) {
            console.error("load[error]:", e);
        }
    }
    async create(name, value) {
        if (this.databases.has(name))
            return false;
        try {
            const randomName = randomId(6)

            const file = {
                info: `${randomName}.info.json`,
                db: `${randomName}.db.json`
            };

            const info = {
                date: new Date(),
                databaseName: name,
                database: this.folder
                    + file.db
            };

            await createJSON(this.resfolder,
                file.info, info);
            await createJSON(this.resfolder,
                file.db, value || {});

            const db = new LowDB({
                defaultData: {},
                filename: path.join(
                    this.resfolder,
                    file.db)
            });

            await db.read();
            this.databases.set(name, {
                ...info, ...db,
                write: () => db.write()
            });

            return true;
        } catch (e) {
            console.log('create[error]:', e)
        }
    }

    async delete(name) {
        if (!this.databases.has(name)) return false;
        const database = this.databases.get(name);
        if (!database) return false;
        try {
            if (await access(database.database))
                await fs.promises.unlink(database.database);

            if (await access(database.database
                .replace('.db.json', '.info.json')))
                await fs.promises.unlink(database.database
                    .replace('.db.json', '.info.json'));

            this.databases.delete(name);
            return true;
        } catch (e) {
            console.error(`delete[error]: ${name}:`, e);
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