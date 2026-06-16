#!/bin/sh
set -e

echo "⏳ Exécution des migrations Prisma..."
npx --yes prisma migrate deploy

echo "🚀 Démarrage de l'application NestJS..."
exec node dist/main.js
