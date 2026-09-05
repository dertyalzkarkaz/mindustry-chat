const { WebSocketServer } = require('ws');
const PORT = process.env.PORT || 8080;
const wss = new WebSocketServer({ port: PORT });

console.log(`Сервер чата запущен на порту ${PORT}...`);

wss.on('connection', (ws) => {
    console.log('Игрок подключился');
    ws.on('message', (message) => {
        const textMessage = message.toString();
        wss.clients.forEach((client) => {
            if (client.readyState === 1) {
                client.send(textMessage);
            }
        });
    });
    ws.on('close', () => console.log('Игрок отключился'));
});
