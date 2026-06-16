#!/bin/sh
set -e

echo "Exécution des migrations Prisma..."
npx --yes prisma migrate deploy

if [ -f "dump.sql" ]; then
  echo "Restauration de la base de données de production à partir des données locales..."
  psql "$DATABASE_URL" -f dump.sql
  echo "Restauration terminée."
  rm dump.sql
fi

echo "Démarrage de l'application..."
exec node dist/main.js
