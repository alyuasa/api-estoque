const http = require('http');

const server = http.createServer();

const port = process.env.PORT;

server.listen(3000, ()=> {
    console.log('Express rodando na porta 3000');
});