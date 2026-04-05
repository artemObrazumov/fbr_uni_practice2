#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"

cert_is_self_signed() {
  local cert_file="$1"
  local issuer subject
  issuer="$(openssl x509 -in "$cert_file" -noout -issuer 2>/dev/null | sed 's/^issuer=//')"
  subject="$(openssl x509 -in "$cert_file" -noout -subject 2>/dev/null | sed 's/^subject=//')"
  [[ -n "$issuer" && "$issuer" == "$subject" ]]
}

if [[ ! -f build/index.html ]]; then
  echo "[start-all] Нет build/ — выполняю npm run build (нужно для node server.js)..."
  npm run build
fi

need_new_certs=0
if [[ ! -f localhost.pem ]] || [[ ! -f localhost-key.pem ]]; then
  need_new_certs=1
elif cert_is_self_signed "localhost.pem"; then
  echo "[start-all] Найден self-signed сертификат localhost.pem."
  echo "[start-all] Он часто ломает WebSocket/Push на https://localhost:3001 (ERR_CERT_AUTHORITY_INVALID)."
  need_new_certs=1
fi

if [[ "$need_new_certs" -eq 1 ]]; then
  if command -v mkcert >/dev/null 2>&1; then
    echo "[start-all] Генерирую доверенный localhost-сертификат через mkcert..."
    npm run setup:https-mkcert
  else
    echo "[start-all] mkcert не найден — создаю self-signed через openssl..."
    npm run setup:https-certs
    echo "[start-all] ВАЖНО: для корректных уведомлений и WebSocket лучше установить mkcert и повторить запуск."
  fi
fi

cleanup() {
  if [[ -n "${SERVER_PID:-}" ]] && kill -0 "$SERVER_PID" 2>/dev/null; then
    kill "$SERVER_PID" 2>/dev/null || true
    wait "$SERVER_PID" 2>/dev/null || true
  fi
}
trap cleanup EXIT INT TERM

echo "[start-all] Запуск API: https://localhost:3001 (в фоне)"
npm run server &
SERVER_PID=$!

sleep 1

echo "[start-all] Запуск фронта: https://localhost:3000 (Ctrl+C — остановит оба)"
npm start
