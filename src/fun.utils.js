import fs from 'fs/promises'
import crypto from 'crypto';
import path from 'path';

const access = async (path) =>
    await fs.access(path)
        .then(() => true)
        .catch(() => false)

const createJSON = async (folder, file, data) =>
    fs.writeFile(path.join(folder, file),
        JSON.stringify(data, null, 2), 'utf8')
        .then(() => true)
        .catch(() => false);

const randomId = (number) =>
    crypto.randomBytes(number)
        .toString('hex')
        .toUpperCase();

const color = {
    text: {
        rgb: (r, g, b) => (text) => `\x1b[38;2;${r};${g};${b}m${text}\x1b[0m`,
        black: (text) => `\x1b[30m${text}\x1b[0m`,
        red: (text) => `\x1b[31m${text}\x1b[0m`,
        green: (text) => `\x1b[32m${text}\x1b[0m`,
        yellow: (text) => `\x1b[33m${text}\x1b[0m`,
        blue: (text) => `\x1b[34m${text}\x1b[0m`,
        magenta: (text) => `\x1b[35m${text}\x1b[0m`,
        cyan: (text) => `\x1b[36m${text}\x1b[0m`,
        white: (text) => `\x1b[37m${text}\x1b[0m`
    },
    bg: {
        rgb: (r, g, b) => (text) => `\x1b[48;2;${r};${g};${b}m${text}\x1b[0m`,
        black: (text) => `\x1b[40m${text}\x1b[0m`,
        red: (text) => `\x1b[41m${text}\x1b[0m`,
        green: (text) => `\x1b[42m${text}\x1b[0m`,
        yellow: (text) => `\x1b[43m${text}\x1b[0m`,
        blue: (text) => `\x1b[44m${text}\x1b[0m`,
        magenta: (text) => `\x1b[45m${text}\x1b[0m`,
        cyan: (text) => `\x1b[46m${text}\x1b[0m`,
        white: (text) => `\x1b[47m${text}\x1b[0m`
    }
}

export {
    color,
    randomId,
    createJSON,
    access
}
