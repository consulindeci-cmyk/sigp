# Développement local — SIGP Backend

## Architecture

- **Production** : Vercel (frontend) → Render (backend NestJS, Docker) → Supabase (PostgreSQL). Inchangé par ce setup.
- **Local** : NestJS tourne directement sur l'hôte (`npm run start:dev`, hot-reload natif) ;
  Docker ne sert qu'aux services d'infra (PostgreSQL, Redis, MinIO, Mailhog, Adminer).

Le Dockerfile n'a que les stages `builder`/`production` (utilisés pour le build Render) —
il n'y a pas de stage `development`, donc l'API elle-même ne se containerise pas en local.

## Démarrage

1. **Services d'infra** (depuis `sigp-backend-v1/`) :
   ```
   docker compose -f docker-compose.dev.yml up -d db redis
   ```
   Ça démarre Postgres (`sigp-db-dev`, base `sigp_dev`, user `sigp`) et Redis (`sigp-redis-dev`).
   Ajouter `minio mailhog adminer` si besoin (upload de fichiers, emails, inspection DB via
   http://localhost:8080).

2. **Variables d'environnement** : `.env` (chargé en fallback par Prisma CLI *et* par NestJS)
   doit pointer sur le Postgres Docker local, jamais sur Supabase :
   ```
   DATABASE_URL="postgresql://sigp:sigp_dev_pass@localhost:5432/sigp_dev?schema=public"
   DIRECT_URL="postgresql://sigp:sigp_dev_pass@localhost:5432/sigp_dev?schema=public"
   ```
   `.env.development` (chargé en priorité quand `NODE_ENV=development`) a la même config.
   Les deux sont dans `.gitignore` — jamais commités.

   ⚠️ Piège connu : `npx prisma <commande>` charge `.env` par défaut, **pas**
   `.env.development` (Prisma ne connaît pas la convention NODE_ENV de NestJS). Si `.env`
   contient jamais une URL Supabase, toute commande Prisma lancée en local irait taper la
   prod. Vérifier `.env` avant tout `migrate`/`db seed`.

3. **Clés JWT** : générées automatiquement si absentes (`npm run generate:keys` ou au premier
   `npm run start:dev` — voir `scripts/generate-keys.ts`). Jamais commitées (`keys/` gitignoré).

4. **Migrations + client Prisma** :
   ```
   npx prisma generate
   npx prisma migrate dev
   ```
   `migrate dev` applique les migrations manquantes et, si le schéma local a divergé de
   l'historique des migrations, propose (ou force, en cas de drift) un reset local — sans
   danger, c'est une base jetable. Ne jamais lancer `migrate reset`/`migrate dev` avec un
   `DATABASE_URL` de production.

5. **Seed** (comptes de démo + hiérarchie organisationnelle minimale) :
   ```
   npx prisma db seed
   ```
   Le garde-fou dans `prisma/seed.ts` (`ALLOW_PROD_SEED`) ne bloque qu'en production —
   en local (`NODE_ENV=development`), le seed tourne librement. Idempotent : peut être
   relancé sans dupliquer les données.

6. **Lancer l'API** :
   ```
   npm run start:dev
   ```
   → `http://localhost:3000/api/v1/health` doit répondre `{"status":"ok", "database":"up", "redis":"up"}`.

## Workflow complet dev → prod

```
docker compose -f docker-compose.dev.yml up -d db redis   # infra locale
npm run start:dev                                          # dev avec hot-reload
# ... développement, tests locaux contre sigp_dev ...
git add -A && git commit -m "..."
git push origin <branche>:main
# → Render redéploie automatiquement (build Docker + `prisma migrate deploy` + démarrage)
# → Vercel redéploie automatiquement le frontend
```

Aucune étape manuelle côté déploiement : voir `docs/migrations.md` pour le détail du
pipeline Render et la procédure de migration/seed en production.

## Sécurité — secrets locaux vs production

- `.env`, `.env.development`, `.env.test` : gitignorés, ne doivent contenir **que** des
  identifiants locaux (`sigp_dev_pass`, secrets JWT `*-dev-*`/`*-test-*` de complaisance).
- Les vrais secrets (Supabase, JWT prod) vivent uniquement dans Render (`sync: false` dans
  `render.yaml`) et ne doivent jamais être copiés dans un fichier local, même temporairement.
- `.env.example` documente les clés attendues avec des valeurs factices — c'est le seul
  fichier `.env*` commité côté backend.
