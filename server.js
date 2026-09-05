const http = require('http');
const PORT = process.env.PORT || 8080;

let chatMessages = ["[purple]Система: [white]Чат успешно обновлен!"];
let totalUsers = new Set(); // Список всех уникальных ников
let onlineUsers = {};      // Никнеймы и время их последнего онлайна

const server = http.createServer((req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', '*');
    res.setHeader('Content-Type', 'application/json; charset=utf-8');

    // Очищаем онлайн от тех, кто не слал запросы больше 10 секунд
    const now = Date.now();
    Object.keys(onlineUsers).forEach(user => {
        if (now - onlineUsers[user] > 10000) {
            delete onlineUsers[user];
        }
    });

    if (req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });
        req.on('end', () => {
            try {
                const data = JSON.parse(body);
                
                // Регистрируем пользователя
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
        // GET запрос передает данные об участниках обратно в игру
        // Проверяем query параметры, если мод передал ник при обновлении чата
        const urlParams = new URL(req.url, `http://${req.headers.host}`);
        const userParam = urlParams.searchParams.get('user');
        if (userParam) {
            totalUsers.add(userParam);
            onlineUsers[userParam] = Date.now();
        }

        res.end(JSON.stringify({ 
            history: chatMessages,
            total: totalUsers.size,
            online: Object.keys(onlineUsers).length
        }));
    }
});

server.listen(PORT, () => {
    console.log(`Сервер с счетчиками онлайна работает на порту ${PORT}`);
});
