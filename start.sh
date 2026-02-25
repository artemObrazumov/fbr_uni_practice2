#!/bin/bash

echo "Запуск фронтенда..."
(cd backend && npm start) &

echo "Запуск бэкенда..."
(cd frontend && npm run dev) &

wait
