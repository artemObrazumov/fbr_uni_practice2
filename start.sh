#!/bin/bash

kill -9 $(lsof -t -i:3000)
kill -9 $(lsof -t -i:3001)

echo "Starting backend..."
(cd backend && npm start) &
echo "Starting frontend..."
(cd frontend && PORT=3000 npm start)