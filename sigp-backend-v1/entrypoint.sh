#!/bin/sh
set -e

if [ ! -f keys/private.pem ] || [ ! -f keys/public.pem ]; then
  echo "[SIGP] No JWT RSA keypair found — generating one (ephemeral, container filesystem)..."
  openssl genrsa -out keys/private.pem 2048
  openssl rsa -in keys/private.pem -pubout -out keys/public.pem
fi

echo "[SIGP] Running Prisma migrations..."
npx prisma migrate deploy

echo "[SIGP] Starting backend server connected to Supabase..."
exec node dist/main.js
