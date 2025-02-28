# Socket-DB

**Socket-DB** es una base de datos basada en WebSockets que permite almacenar, modificar y recuperar mediante conexiones cliente-servidor.

## Instalación

Instala en tu proyecto:

```sh
npm install github:Zeppth/socket-db
```

## Uso

### Servidor

```js
const server = new SocketServer({
    folder: './databases/',
    password: '12345678',
    port: 8080
});
```

### Cliente

El cliente se conecta al servidor de WebSockets utilizando una URL y una contraseña. Una vez conectado, puede interactuar con la base de datos, creando, modificando y consultando datos en tiempo real.

```js
const client = new SocketClient({
    url: 'ws://localhost:8080', // Dirección del servidor
    password: '12345678' // Contraseña de acceso
});
```

## Eventos

| Evento       | Descripción                                       |
| ------------ | ------------------------------------------------- |
| `error`      | Captura errores en el servidor o cliente          |
| `message`    | Recibe mensajes del servidor                      |
| `connection` | Detecta cuando un usuario se conecta o desconecta |

## Métodos

### Métodos del Cliente (`client`)

| Método                          | Descripción                                      |
| ------------------------------- | ------------------------------------------------ |
| `client.create(nombre, objeto)` | Crea una nueva base de datos                     |
| `client.delete(nombre)`         | Elimina una base de datos                        |
| `client.open(nombre)`           | Abre una base de datos existente                 |

### Métodos de la Base de Datos (`db`)

Para utilizar estos métodos, primero se debe abrir una base de datos con `client.open(nombre)`.

| Método                  | Descripción                                      |
| ------------------------ | ------------------------------------------------ |
| `db.set(path, objeto)`  | Guarda un valor en la base de datos              |
| `db.get(path?)`         | Obtiene un valor de la base de datos             |
| `db.assign(path, objeto)` | Modifica parcialmente un objeto almacenado       |
| `db.has(path)`          | Verifica si una clave existe en la base de datos |
| `db.delete(path)`       | Elimina una clave de la base de datos            |
| `db.chain`              | Permite realizar múltiples operaciones en cadena |

## Notas

- Las operaciones deben ser asíncronas (`await`).
- `db.chain` permite realizar múltiples operaciones antes de enviarlas con `.run()`.
- La seguridad está basada en una contraseña compartida entre cliente y servidor.


Este proyecto no está disponible en NPM.


