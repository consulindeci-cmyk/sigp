#!/bin/sh
set -e

echo "Exécution des migrations Prisma..."
npx --yes prisma migrate deploy

echo "Exécution du seed..."
npx --yes tsx prisma/seed.ts

echo "Démarrage de l'application..."
exec node dist/main.js
