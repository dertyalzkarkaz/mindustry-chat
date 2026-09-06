const http = require('http');
const url = require('url');
const PORT = process.env.PORT || 8080;

let chatMessages = ["[purple]Система: [white]The chat has been updated successfully.!"];
let totalUsers = new Set(); 
let onlineUsers = {};      
let mainServerAddress = { ip: "", port: 6567 };

const server = http.createServer((req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', '*');
    res.setHeader('Content-Type', 'application/json; charset=utf-8');

    const now = Date.now();
    Object.keys(onlineUsers).forEach(user => {
        if (now - onlineUsers[user] > 12000) {
            delete onlineUsers[user];
        }
    });

    const parsedUrl = url.parse(req.url, true);
    const userParam = parsedUrl.query.user;

    if (userParam) {
        totalUsers.add(userParam);
        onlineUsers[userParam] = now;
    }

    if (parsedUrl.pathname === '/api/set-main-server' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });
        req.on('end', () => {
            try {
                const data = JSON.parse(body);
                if (data.ip) {
                    mainServerAddress.ip = data.ip;
                    mainServerAddress.port = data.port || 6567;
                    res.end(JSON.stringify({ status: "ok" }));
                } else {
                    res.end(JSON.stringify({ error: "Missing IP" }));
                }
            } catch(e) {
                res.end(JSON.stringify({ error: "Invalid JSON" }));
            }
        });
        return;
    }

    if (parsedUrl.pathname === '/api/main-server' && req.method === 'GET') {
        if (!mainServerAddress.ip) {
            res.statusCode = 503;
            res.end(JSON.stringify({ error: "Игровой сервер еще не запустился" }));
        } else {
            res.end(JSON.stringify(mainServerAddress));
        }
        return;
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
