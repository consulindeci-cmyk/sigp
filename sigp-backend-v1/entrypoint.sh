#!/bin/sh
set -e

echo "[SIGP] Starting backend server connected to Supabase..."
exec node dist/main.js
