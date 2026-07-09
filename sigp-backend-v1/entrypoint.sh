#!/bin/sh
set -e

echo "[SIGP] Running Prisma migrations..."
npx prisma migrate deploy

echo "[SIGP] Migrations complete. Starting server..."
exec node dist/main.js
