# --- Étape 1 : Construction (Builder) ---
FROM node:22-alpine AS builder

# Dépendances système : openssl pour Prisma, libc6-compat pour binaires natifs (bcrypt)
RUN apk add --no-cache openssl libc6-compat

WORKDIR /app

# Copie des manifestes NPM et du schéma Prisma en premier (optimisation du cache Docker)
COPY package*.json ./
COPY prisma ./prisma/

# Installation de TOUTES les dépendances (dev incluses : @nestjs/cli, typescript, prisma CLI)
RUN npm ci

# Génération du client Prisma adapté à Alpine Linux
RUN npx prisma generate

# Copie du reste des sources
COPY . .

# Compilation TypeScript → JavaScript dans ./dist
RUN npm run build

# Suppression des devDependencies pour alléger l'image finale
RUN npm prune --omit=dev

# --- Étape 2 : Production (Runner) ---
FROM node:22-alpine AS runner

# Mêmes dépendances système nécessaires à l'exécution de Prisma
RUN apk add --no-cache openssl libc6-compat

WORKDIR /app

ENV NODE_ENV=production

# Seuls les artefacts nécessaires à la production sont copiés
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

# Copie et configuration du script d'entrée (migrations + démarrage)
COPY entrypoint.sh ./entrypoint.sh
RUN chmod +x ./entrypoint.sh

EXPOSE 3000

ENTRYPOINT ["./entrypoint.sh"]
