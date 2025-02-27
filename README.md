# socket-db

``` js
import { SocketServer } from "socket-db";
const server = new SocketServer({
    folder: './databases/',
    password: '12345678',
    port: 8080,
})

server.ev.on('error', (data) => {
    console.log('error', data)
})
server.ev.on('message', (data) => {
    console.log('message', data)
})
server.ev.on('connection', (data) => {
    console.log('connection', data)
})
```
