const http = require('http');
const PORT = process.env.PORT || 8080;

let chatMessages = ["[purple]Система: [white]Сервер в облаке успешно запущен и работает!"];

const server = http.createServer((req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', '*');
    res.setHeader('Content-Type', 'application/json; charset=utf-8');

    if (req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });
        req.on('end', () => {
            try {
                const data = JSON.parse(body);
                if (data.msg) {
                    chatMessages.push(data.msg);
                    if (chatMessages.length > 8) chatMessages.shift();
                }
                res.end(JSON.stringify({ status: "ok" }));
            } catch(e) {
                res.end(JSON.stringify({ error: "Invalid JSON" }));
            }
        });
    } else {
        res.end(JSON.stringify({ history: chatMessages }));
    }
});

server.listen(PORT, () => {
    console.log(`HTTP сервер чата запущен на порту ${PORT}`);
});
