const http = require('http');
const url = require('url'); // Добавили стандартный модуль для разбора ссылок
const PORT = process.env.PORT || 8080;

let chatMessages = ["[purple]Система: [white]Чат успешно обновлен!"];
let totalUsers = new Set(); 
let onlineUsers = {};      

const server = http.createServer((req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', '*');
    res.setHeader('Content-Type', 'application/json; charset=utf-8');

    const now = Date.now();
    Object.keys(onlineUsers).forEach(user => {
        if (now - onlineUsers[user] > 12000) { // 12 секунд таймаут
            delete onlineUsers[user];
        }
    });

    // Разбираем URL по-старому (работает стабильно)
    const parsedUrl = url.parse(req.url, true);
    const userParam = parsedUrl.query.user;

    if (userParam) {
        totalUsers.add(userParam);
        onlineUsers[userParam] = now;
    }

    if (req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });
        req.on('end', () => {
            try {
                const data = JSON.parse(body);
                if (data.user) {
                    totalUsers.add(data.user);
                    onlineUsers[data.user] = Date.now();
                }
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
        res.end(JSON.stringify({ 
            history: chatMessages,
            total: totalUsers.size,
            online: Object.keys(onlineUsers).length
        }));
    }
});

server.listen(PORT, () => {
    console.log(`Сервер с рабочими счетчиками запущен на порту ${PORT}`);
});
