# Socket-DB

**Socket-DB** es una base de datos basada en WebSockets que permite almacenar, modificar y recuperar datos en tiempo real mediante conexiones cliente-servidor.

## Instalación

Para instalarlo en tu proyecto, usa:

```sh
npm install github:Zeppth/socket-db
```

## Uso

### Servidor

Para iniciar un servidor de base de datos:

```js
const server = new SocketServer({
    folder: './databases/', // Carpeta donde se almacenarán las bases de datos
    password: '12345678', // Contraseña de acceso
    port: 8080 // Puerto del servidor
});
```

### Cliente

Para conectar un cliente al servidor y comenzar a interactuar con la base de datos:

```js
const client = new SocketClient({
    url: 'ws://localhost:8080', // Dirección del servidor
    password: '12345678' // Contraseña de acceso
});
```

## Eventos

Los eventos provienen de `server.ev` y pueden ser manejados de la siguiente manera:

```js
server.ev.on('error', (err) => {
    console.error('Error:', err);
});

server.ev.on('message', (msg) => {
    console.log('Mensaje recibido:', msg);
});

server.ev.on('connection', (conn) => {
    console.log('Nueva conexión:', conn.id);
});
```

| Evento       | Descripción                                      |
|-------------|--------------------------------------------------|
| `error`      | Captura errores en el servidor o cliente        |
| `message`    | Recibe mensajes del servidor                    |
| `connection` | Detecta cuando un usuario se conecta o desconecta |

## Métodos

### Métodos del Cliente (`client`)

| Método                          | Descripción                                      |
|--------------------------------|------------------------------------------------|
| `client.create(nombre, objeto)` | Crea una nueva base de datos                    |
| `client.delete(nombre)`         | Elimina una base de datos                        |
| `client.open(nombre)`           | Abre una base de datos existente                 |

### Métodos de la Base de Datos (`db`)

Para utilizar estos métodos, primero se debe abrir una base de datos con `client.open(nombre)`.

| Método                  | Descripción                                      |
|------------------------|------------------------------------------------|
| `db.set(path, objeto)`  | Guarda un valor en la base de datos              |
| `db.get(path?)`         | Obtiene un valor de la base de datos             |
| `db.assign(path, objeto)` | Modifica parcialmente un objeto almacenado       |
| `db.has(path)`          | Verifica si una clave existe en la base de datos |
| `db.delete(path)`       | Elimina una clave de la base de datos            |
| `db.chain`              | Permite realizar múltiples operaciones en cadena |

## Notas

- Todas las operaciones son asíncronas, por lo que se debe usar `await` para evitar errores.
- `db.chain` permite ejecutar múltiples operaciones de forma encadenada antes de enviarlas con `.run()`.
- La conexión entre cliente y servidor está protegida mediante una contraseña definida al iniciar el servidor.
- Si una base de datos no existe al abrirla con `client.open(nombre)`, se generará un error.
- `db.has(path)` puede ser útil para verificar la existencia de datos antes de modificarlos o eliminarlos.
- `client.delete(nombre)` elimina por completo una base de datos y su contenido, por lo que se debe usar con precaución.

**Nota:** Este proyecto no está disponible en NPM.
