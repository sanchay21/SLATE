const WebSocket = require('ws');
const http = require('http');
const { setupWSConnection } = require('y-websocket/bin/utils');

const port = process.env.PORT || 1234;
const server = http.createServer((request, response) => {
  response.writeHead(200, { 'Content-Type': 'text/plain' });
  response.end('okay');
});

const wss = new WebSocket.Server({ server });

wss.on('connection', (conn, req) => {
  console.log('New connection:', req.url);
  // setupWSConnection manages the Yjs document state for the room specified in req.url
  setupWSConnection(conn, req);
});

server.listen(port, () => {
  console.log(`Collaboration server running on port ${port}`);
});
