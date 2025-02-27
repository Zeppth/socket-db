import util from 'util'
import { SocketServer } from "./fun.server.js";
import { randomId } from "./fun.utils.js";
import express from 'express'

let start = false
const password = randomId(6)
const app = express()

async function run() {
    if (start) return
    else start = true
    try {
        const server = new SocketServer({
            folder: './databases/',
            password: password,
            port: 8080,
            app: app,
        })

        server.ev.on('error', (data) =>
            console.log(data))
        server.ev.on('message', (data) =>
            console.log(data))
        server.ev.on('connection', (data) =>
            console.log(data))

        await server.load()
    } catch (e) {
        start = false
        console.log(util.format(e))
        await new Promise(resolve =>
            setTimeout(resolve, 2000));
        await run()
    }
}

console.log('password:', password)

setInterval(() => {
    console.log('password:', password)
}, 1000 * 60)

await run()

app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="es">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>socket-db</title>
            <style>
                body {
                    background-color: black;
                    color: white;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    height: 100vh;
                    margin: 0;
                    font-family: Arial, sans-serif;
                }
                h1 {
                    font-size: 2em;
                }
            </style>
        </head>
        <body>
            <h1>socket-db</h1>
        </body>
        </html>
    `);
});