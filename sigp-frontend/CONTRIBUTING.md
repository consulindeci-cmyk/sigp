# Conventions de Développement (SIGP Frontend)

Ce document centralise les règles strictes que chaque contributeur doit respecter lors du développement sur ce projet.

## 1. Règle d'Or (Zéro Dette)
- **Aucun style inline (`style={{...}}`)** n'est autorisé pour structurer la page, définir des couleurs, des z-index ou des espacements. 
- Utilisez les classes utilitaires CSS définies dans `index.css`.
- Vérifiez toujours si un composant n'existe pas déjà dans `src/components/ui/` avant d'en créer un nouveau.

## 2. Nommage (Naming Conventions)
- **Fichiers Composants** : PascalCase (ex: `ProjectDashboard.tsx`).
- **Hooks** : camelCase, toujours préfixés par `use` (ex: `useBudgetAnalytics.ts`).
- **Interfaces / Types** : Toujours en PascalCase (ex: `interface ProjectData`).
- **Fichiers Utilitaires** : camelCase (ex: `formatDate.ts`).

## 3. Typage (TypeScript)
- Le mot-clé `any` est **strictement interdit** pour les nouvelles fonctionnalités.
- Exportez et réutilisez les interfaces depuis un fichier centralisé si elles sont partagées.

## 4. Architecture et Dossiers
- `src/components/ui/` : Uniquement des composants visuels agnostiques (sans appels API).
- `src/components/[domaine]/` : Assemblage de composants UI et injection de la logique métier.
- `src/hooks/` : Logique d'orchestration et requêtes (React Query, Zustand).
- `src/services/` : Fonctions pures d'appels à l'API (Axios, Fetch).

## 5. Responsive Design
- Pensez "Mobile-First".
- Vérifiez toujours le rendu de vos grilles et tableaux sur des fenêtres rétrécies avant de créer une Pull Request.
