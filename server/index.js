const express = require('express');
const http = require('http');
const path = require('path');
const cors = require('cors');
const projectsRoute = require('./routes/projects');

const port = normalizePort(process.env.PORT || '3000');

async function main() {
    const app = express();

    app.use(express.json());
    app.use(express.urlencoded({ extended: false }));
    app.set('port', port);
    // Dev only
    app.use(cors());

    app.use('/', express.static(path.resolve(__dirname, '../public')));
    app.use('/app', express.static(path.resolve(__dirname, '../dist')));

    app.use('/projects', projectsRoute);

    const server = http.createServer(app);
    server.listen(port);
    server.on('error', onError);
    server.on('listening', () => onListening(server));
}

function normalizePort(val) {
    var port = parseInt(val, 10);

    if (isNaN(port)) {
        return val;
    }

    if (port >= 0) {
        return port;
    }

    return false;
}

function onError(error) {
    if (error.syscall !== 'listen') {
        throw error;
    }

    const bind = typeof port === 'string'
        ? 'Pipe ' + port
        : 'Port ' + port;

    switch (error.code) {
        case 'EACCES':
            console.error(bind + ' requires elevated privileges');
            process.exit(1);
            break;
        case 'EADDRINUSE':
            console.error(bind + ' is already in use');
            process.exit(1);
            break;
        default:
            throw error;
    }
}

function onListening(server) {
    const addr = server.address();
    const bind = typeof addr === 'string'
        ? 'pipe ' + addr
        : 'port ' + (addr.port);
    console.log('Listening on ' + bind);
}

main();
