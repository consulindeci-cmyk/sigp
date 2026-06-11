# Système d'Information de Gestion de Projets (SIGP) — Backend

Ce projet est un backend robuste et sécurisé développé avec **NestJS, Prisma ORM, et PostgreSQL**, spécialement conçu pour la gestion des projets de développement financés par des bailleurs internationaux (Banque Mondiale, BAD, etc.).

## 🚀 Fonctionnalités principales

* **Authentification & RBAC** : JWT (Access + Refresh tokens), mots de passe hachés avec Bcrypt, et gestion fine des rôles (`SUPER_ADMIN`, `COORDONNATEUR`, `AUDITEUR`, etc.).
* **Gestion de Projets complète** : Cycle de vie du projet, cadre logique (Impact → Activités).
* **Gestion Budgétaire** : PTBA, lignes budgétaires, suivi des sources de financement.
* **Exécution & Suivi** : WBS, Tâches, Journal immuable des Opérations.
* **Valeur Acquise (EVM)** : Calculs automatisés de la performance (PV, EV, AC, CV, SV, CPI, SPI, EAC, VAC).
* **Passation des Marchés (PPM)** : Suivi des contrats, méthodes de passation, et dates prévisionnelles.
* **Gestion des Risques** : Matrice Probabilité × Impact, criticité calculée automatiquement.
* **Gestion Documentaire** : Upload local (Multer) et versioning des documents projet.
* **Traçabilité** : Intercepteur d'audit global enregistrant toutes les mutations (POST, PATCH, DELETE) avec les anciennes et nouvelles valeurs.
* **Tableau de Bord** : Agrégation des données financières et d'exécution en temps réel.

## 🛠️ Stack Technique

* **Framework** : NestJS (Node.js 22+)
* **Langage** : TypeScript
* **Base de données** : PostgreSQL 16+
* **ORM** : Prisma
* **Validation** : class-validator, class-transformer
* **Sécurité** : Passport, JWT, Bcrypt
* **Documentation API** : Swagger / OpenAPI
* **Conteneurisation** : Docker, Docker Compose

## 📋 Prérequis

* Node.js 22 ou supérieur
* PostgreSQL 16 ou supérieur (ou utiliser Docker)
* Docker et Docker Compose (optionnel mais recommandé)

## ⚙️ Installation pas à pas

1. **Cloner le dépôt et installer les dépendances**
   ```bash
   git clone <votre-repo>
   cd sigp-backend
   npm install
   ```

2. **Configurer les variables d'environnement**
   ```bash
   cp .env.example .env
   ```
   *Vérifiez les valeurs dans le fichier `.env`, notamment `DATABASE_URL`.*

3. **Générer le client Prisma et créer la base de données**
   ```bash
   npx prisma generate
   npx prisma migrate dev --name init
   ```

4. **Peupler la base de données avec des données de démonstration (Seed)**
   ```bash
   npx prisma db seed
   ```

5. **Démarrer l'application**
   ```bash
   npm run start:dev
   ```

## 🐳 Déploiement avec Docker

Pour lancer la base de données et l'application directement avec Docker Compose :

```bash
docker-compose up -d
```

## 📚 Documentation de l'API

Une fois l'application démarrée, la documentation interactive Swagger est accessible à cette adresse :
👉 **http://localhost:3000/api/docs**

## 🔐 Comptes de test (Seed)

| Rôle | Email | Mot de passe |
| :--- | :--- | :--- |
| **Super Administrateur** | `admin@sigp.ci` | `Admin@2026` |
| **Coordonnateur Projet** | `coord@sigp.ci` | `Coord@2026` |
| **Responsable Financier**| `finance@sigp.ci` | `Finance@2026` |
| **Bailleur** | `bailleur@banquemonde.org` | `Bailleur@2026` |
| **Auditeur** | `audit@sigp.ci` | `Audit@2026` |

## 📁 Architecture des Modules

* `/auth` : Authentification et tokens
* `/users` : Gestion des utilisateurs
* `/projects` : Fiches projets
* `/logframe` : Cadre logique
* `/ptba` : Plan de travail et budget annuel
* `/budget` : Lignes budgétaires
* `/funding` : Sources de financement
* `/wbs` : Structure de découpage du projet
* `/tasks` : Activités et tâches
* `/operations` : Journal des opérations (décaissements/engagements)
* `/procurement` : Plan de passation des marchés
* `/risks` : Suivi des risques
* `/documents` : Gestion documentaire
* `/evm` : Moteur de calcul de la valeur acquise
* `/dashboard` : Statistiques agrégées
* `/audit-logs` : Traçabilité des actions
