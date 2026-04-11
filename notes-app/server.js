const fs = require('fs');
const express = require('express');
const http = require('http');
const https = require('https');
const { Server } = require('socket.io');
const webpush = require('web-push');
const cors = require('cors');
const path = require('path');

const vapidKeys = {
  publicKey:
    'BDIlw_b7yfkhkbuMMa3R2z8uXm_nktZAdQMnhn2fdr3P9kIiq2tf4MXwZC9VWHQhxY1whXaM9NcNZpyKt1LptB4',
  privateKey: 'jpmNyD6IADDhcC7tjQD6dAUlDFbDov7_-mY65JjmIxc',
};

webpush.setVapidDetails(
  'mailto:artem@example.local',
  vapidKeys.publicKey,
  vapidKeys.privateKey
);

const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

let subscriptions = [];
const reminders = new Map();

function sendPushToAll(payload, opts = { TTL: 86_400, urgency: 'normal' }) {
  if (subscriptions.length === 0) {
    console.log(
      'Push: нет подписчиков (нажмите «Включить уведомления» на клиенте).'
    );
    return;
  }
  Promise.all(
    subscriptions.map((sub) =>
      webpush
        .sendNotification(sub, payload, opts)
        .then(() => {
          console.log('Push отправлен:', sub.endpoint.slice(-24));
          return null;
        })
        .catch((err) => {
          const code = err.statusCode;
          console.error('Push error:', code, err.message || err.body);
          if (code === 410 || code === 404) return sub.endpoint;
          return null;
        })
    )
  ).then((results) => {
    const stale = results.filter(Boolean);
    if (stale.length) {
      subscriptions = subscriptions.filter((s) => !stale.includes(s.endpoint));
    }
  });
}

function scheduleReminder(reminder) {
  const { id, text, reminderTime } = reminder;
  const delay = Number(reminderTime) - Date.now();
  if (!Number.isFinite(delay) || delay <= 0) return false;
  if (!Number.isFinite(Number(id)) || typeof text !== 'string') return false;

  if (reminders.has(id)) {
    clearTimeout(reminders.get(id).timeoutId);
  }

  const timeoutId = setTimeout(() => {
    const payload = JSON.stringify({
      title: 'Напоминание',
      body: text,
      reminderId: id,
    });
    sendPushToAll(payload);
    reminders.delete(id);
  }, delay);

  reminders.set(id, {
    timeoutId,
    text,
    reminderTime: Number(reminderTime),
  });

  return true;
}

app.post('/subscribe', (req, res) => {
  const sub = req.body;
  if (!sub || typeof sub.endpoint !== 'string') {
    return res.status(400).json({ message: 'Неверная подписка: нет endpoint' });
  }
  if (!sub.keys || !sub.keys.p256dh || !sub.keys.auth) {
    return res
      .status(400)
      .json({ message: 'Неверная подписка: нет keys.p256dh / keys.auth' });
  }
  subscriptions = subscriptions.filter((s) => s.endpoint !== sub.endpoint);
  subscriptions.push(sub);
  console.log('Push-подписок на сервере:', subscriptions.length);
  res.status(201).json({ message: 'Подписка сохранена' });
});

app.post('/unsubscribe', (req, res) => {
  const { endpoint } = req.body || {};
  if (endpoint) {
    subscriptions = subscriptions.filter((s) => s.endpoint !== endpoint);
  }
  res.status(200).json({ message: 'Подписка удалена' });
});

app.post('/snooze', (req, res) => {
  const reminderId = Number(req.query.reminderId);
  if (!Number.isFinite(reminderId)) {
    return res.status(400).json({ error: 'Invalid reminder id' });
  }

  const reminderFromMap = reminders.get(reminderId);
  const fallbackText = String(req.query.text || '').trim();
  const reminderText = reminderFromMap?.text || fallbackText;
  if (!reminderText) {
    return res.status(404).json({ error: 'Reminder not found' });
  }

  if (reminderFromMap?.timeoutId) {
    clearTimeout(reminderFromMap.timeoutId);
  }

  const requestedDelaySec = Number(req.query.delaySec);
  const delaySec =
    requestedDelaySec === 10 || requestedDelaySec === 300
      ? requestedDelaySec
      : 5 * 60;
  const newDelay = delaySec * 1000;
  const timeoutId = setTimeout(() => {
    const payload = JSON.stringify({
      title: 'Напоминание (отложенное)',
      body: reminderText,
      reminderId,
    });
    sendPushToAll(payload);
    reminders.delete(reminderId);
  }, newDelay);

  reminders.set(reminderId, {
    timeoutId,
    text: reminderText,
    reminderTime: Date.now() + newDelay,
  });

  return res
    .status(200)
    .json({ message: `Reminder snoozed for ${delaySec} seconds` });
});

app.use(express.static(path.join(__dirname, 'build')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

const keyPath = path.join(
  __dirname,
  process.env.SSL_KEY_FILE || 'localhost-key.pem'
);
const certPath = path.join(
  __dirname,
  process.env.SSL_CRT_FILE || 'localhost.pem'
);

let server;
let baseUrl;

const usePlainHttp = String(process.env.USE_HTTP || '').trim() === '1';

if (usePlainHttp) {
  server = http.createServer(app);
  baseUrl = 'http';
} else {
  if (!fs.existsSync(keyPath) || !fs.existsSync(certPath)) {
    console.error('Нет TLS-файлов для HTTPS:');
    console.error(' ', certPath);
    console.error(' ', keyPath);
    console.error('Создайте их: npm run setup:https-certs');
    console.error('Или только HTTP: USE_HTTP=1 npm run server');
    process.exit(1);
  }
  server = https.createServer(
    {
      key: fs.readFileSync(keyPath),
      cert: fs.readFileSync(certPath),
    },
    app
  );
  baseUrl = 'https';
}

const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
});

io.on('connection', (socket) => {
  console.log('Клиент подключён:', socket.id);
  socket.on('newTask', (task) => {
    const payloadTask = {
      id: Number(task && task.id) || Date.now(),
      text: (task && task.text) || '',
      reminder: null,
    };
    io.emit('taskAdded', payloadTask);
    const payload = JSON.stringify({
      title: 'Новая задача',
      body: payloadTask.text,
    });
    sendPushToAll(payload);
  });

  socket.on('newReminder', (reminder) => {
    const id = Number(reminder && reminder.id);
    const text = (reminder && reminder.text) || '';
    const reminderTime = Number(reminder && reminder.reminderTime);
    if (!Number.isFinite(id) || !text || !Number.isFinite(reminderTime)) return;
    io.emit('taskAdded', { id, text, reminder: reminderTime });
    scheduleReminder({ id, text, reminderTime });
  });
  socket.on('disconnect', () => {
    console.log('Клиент отключён:', socket.id);
  });
});

const PORT = process.env.PORT || 3001;
server
  .listen(PORT, () => {
    if (baseUrl === 'https') {
      console.log('');
      console.log(`Сервер отдаёт приложение по HTTPS:`);
      console.log(`  https://localhost:${PORT}`);
      console.log('');
      console.log('Не используйте http:// на этом порту — страница не откроется.');
      console.log(
        'Для разработки (npm start) в .env.development: REACT_APP_API_ORIGIN=https://localhost:' +
          PORT
      );
      console.log('');
    } else {
      console.log(`Сервер (HTTP): http://localhost:${PORT}`);
    }
  })
  .on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(
        `Порт ${PORT} уже занят (запущен другой сервер или старый node server.js).`
      );
      console.error(
        'Варианты: остановите процесс на этом порту или запустите с другим портом, например:'
      );
      console.error(`  PORT=3002 npm run server`);
      console.error('На macOS узнать PID: lsof -i :' + PORT);
    } else {
      console.error(err);
    }
    process.exit(1);
  });
