# Socket-DB

Socket-DB es una base de datos en tiempo real basada en WebSockets.

## Instalación

```sh
npm install github:Zeppth/socket-db
```

## Uso

### Importar

```javascript
import { SocketClient } from "socket-db";
```

### Conectar a un servidor

```javascript
const client = new SocketClient({
    url: "ws://localhost:8080",
    password: "12345678"
});

client.ev.on("error", (e) => console.log("Error:", e));
client.ev.on("message", (data) => console.log("Mensaje:", data));
client.ev.on("connection", (data) => {
    if (data.type === "open") console.log("Conectado al servidor");
    if (data.type === "close") console.log("Desconectado del servidor");
});

await client.start();
```

### Base de datos

```javascript
await client.createDB("system:data", {});
const db = client.dataBase("system:data");

await db.set("users", {});
await db.get();
await db.assign("users", { carlos: { edad: "18" } });
await db.has("users");
await db.delete("users");
```

### Operaciones en cadena

```javascript
const chain = db.chain;

await chain.set("users", {}).get("users").run();
await chain.set("users", {}).get().run();

await chain
    .set("users", {})
    .set("chats", {})
    .set("settings", {})
    .assign("users", { carlos: { edad: "18" } })
    .run();
```

