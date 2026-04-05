/**
 * Если в корне проекта есть localhost.pem / localhost-key.pem,
 * поднимает react-scripts с HTTPS (как npm run start:https).
 * Иначе — обычный HTTP dev-сервер.
 */
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const root = path.join(__dirname, '..');
const cert = path.join(root, 'localhost.pem');
const key = path.join(root, 'localhost-key.pem');

const env = { ...process.env };
if (fs.existsSync(cert) && fs.existsSync(key)) {
  env.HTTPS = 'true';
  env.SSL_CRT_FILE = cert;
  env.SSL_KEY_FILE = key;
  console.log('\n[notes-app] Dev-сервер: HTTPS (найдены localhost.pem).\n');
  console.log('[notes-app] Откройте https://localhost:3000 (или порт из вывода ниже).\n');
} else {
  console.log(
    '\n[notes-app] Dev-сервер: HTTP (нет localhost.pem). Для HTTPS: npm run setup:https-certs\n'
  );
}

const cracoBin = path.join(
  root,
  'node_modules',
  '@craco',
  'craco',
  'dist',
  'bin',
  'craco.js'
);

if (!fs.existsSync(cracoBin)) {
  console.error('Не найден @craco/craco. Выполните npm install');
  process.exit(1);
}

const child = spawn(process.execPath, [cracoBin, 'start'], {
  stdio: 'inherit',
  env,
  cwd: root,
});

child.on('exit', (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  process.exit(code == null ? 1 : code);
});
