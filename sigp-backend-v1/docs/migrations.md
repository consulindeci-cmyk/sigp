# Migrations Prisma & déploiement — SIGP Backend

## Architecture

- **DATABASE_URL** — connexion via le pooler PgBouncer Supabase en mode *transaction*
  (port `6543`, `?pgbouncer=true`). Utilisée par l'application NestJS à l'exécution
  (beaucoup de connexions courtes, adapté au pooling transaction).
- **DIRECT_URL** — connexion via le pooler Supabase en mode *session* (port `5432`,
  sans `pgbouncer=true`). Utilisée uniquement par `prisma migrate` : le mode
  transaction ne supporte pas les advisory locks / prepared statements dont
  `migrate deploy` a besoin. Voir `datasource db` dans `prisma/schema.prisma`.

Les deux variables ne vivent que dans Render (Settings → Environment, `sync: false`
dans `render.yaml`) — jamais dans Git.

## Ajouter une nouvelle migration

1. Modifier `prisma/schema.prisma`.
2. Générer la migration en local, contre une base de **dev** (jamais contre Supabase
   directement pour la génération) :
   ```
   npx prisma migrate dev --name description_du_changement
   ```
   Ça crée `prisma/migrations/<timestamp>_description_du_changement/migration.sql`
   et l'applique à la base locale.
3. Vérifier le SQL généré (le relire, surtout pour les changements destructifs —
   `DROP COLUMN`, changement de type, etc.).
4. Commiter le dossier de migration — **`prisma/migrations/` est versionné**, ce
   n'est pas un artefact généré. Ne jamais le remettre dans `.gitignore`.
5. Push sur `main`. Render redéploie automatiquement et exécute
   `prisma migrate deploy` (via `entrypoint.sh`) avant de démarrer le serveur —
   la migration s'applique à Supabase sans intervention manuelle.

## Déploiement automatique (Render)

`entrypoint.sh`, à chaque démarrage de conteneur :
1. Génère le keypair JWT RSA s'il est absent (`keys/` n'est pas versionné).
2. `prisma migrate deploy` — applique les migrations non encore appliquées.
3. Démarre `node dist/main.js`.

`prisma generate` tourne au **build** (Dockerfile, stage builder), pas au runtime.

Le **seed n'est jamais exécuté automatiquement** — voir ci-dessous.

## Seed manuel (comptes de démonstration)

`prisma/seed.ts` est protégé par un garde-fou : si `NODE_ENV=production`, il refuse
de s'exécuter sauf avec `ALLOW_PROD_SEED=true` explicite. Ça évite qu'un déploiement
automatique ou une erreur de manipulation locale ne réinsère/écrase les comptes de
démo en production.

Pour lancer le seed volontairement contre Supabase (environnement de démo) :

1. Récupérer `DATABASE_URL` et `DIRECT_URL` depuis Render → sigp-backend-v1 →
   Environment (ne jamais les stocker dans un fichier versionné).
2. Depuis `sigp-backend-v1/` en local :
   ```
   NODE_ENV=production ALLOW_PROD_SEED=true \
   DATABASE_URL="<valeur Render>" DIRECT_URL="<valeur Render>" \
   npx prisma db seed
   ```
Le script est idempotent (upsert par email) : le relancer met juste à jour les
mots de passe/rôles des comptes de démo existants, sans les dupliquer.

## Vérifier l'état du schéma

```
DATABASE_URL="<valeur Render>" DIRECT_URL="<valeur Render>" npx prisma migrate status
```
Doit répondre `Database schema is up to date!`. Si une migration a été appliquée
manuellement hors de ce flux (rare, à éviter) et que Prisma refuse avec `P3005`
("schema is not empty"), baseliner migration par migration :
```
npx prisma migrate resolve --applied <nom_de_la_migration>
```
