# Architecture Frontend (Living Documentation)

Ce document décrit l'architecture du projet SIGP, ses principes fondamentaux et les choix structurants. Il doit évoluer en même temps que le code.

## 1. Arborescence du Projet
```text
src/
├── components/
│   ├── ui/          # (NOUVEAU) UI Kit Enterprise partagé (Table, Form, Modals). Composants sans logique métier.
│   ├── project/     # (EXISTANT) Dossier contenant la logique par module (PPM, Budget, PTBA...).
│   │   ├── ppm/     # Composants spécifiques à la matrice PPM.
│   │   ├── budget/  # Composants spécifiques au budget.
│   │   └── ...
│   └── layout/      # Composants globaux de la page (Sidebar, Topbar).
├── hooks/           # Logique métier et appels API via React Query / Zustand.
├── services/        # Fichiers d'appels purs vers le backend (Axios/Fetch).
├── types/           # Interfaces et types TypeScript partagés.
└── pages/           # Vues principales de l'application (assemblage de composants).
```

## 2. Décisions Architecturales (ADR)

### ADR-01 : Création d'un UI Kit Interne (`src/components/ui/`)
- **Contexte** : Duplication massive de code (ex: 4 grilles différentes) et impossibilité de garantir un responsive global.
- **Décision** : Création d'un dossier `/ui` contenant des composants atomiques agnostiques. Tout nouveau développement doit piocher dans cette librairie.
- **Justification** : Réduit drastiquement le code dupliqué, centralise la correction des bugs UI (scroll, z-index), et garantit une expérience utilisateur unifiée sur tout l'ERP.

### ADR-02 : Abandon des styles inline (`style={{...}}`)
- **Contexte** : Présence de >900 styles en dur empêchant le responsive et l'implémentation du mode sombre.
- **Décision** : Interdiction totale des styles structurels inline au profit de `index.css` (Design Tokens).
- **Justification** : Permet de gérer le responsive nativement via CSS, rend le code plus propre (séparation contenant/contenu) et prépare le terrain pour le Theming (Dark Mode).

### ADR-03 : Architecture Responsive (Mobile First)
- **Contexte** : Interface prévue pour Desktop et cassée sur petits écrans.
- **Décision** : Le projet adopte 3 breakpoints majeurs (`768px`, `1024px`) centralisés dans le CSS et/ou dans un composant `<DashboardGrid>`. 
- **Justification** : Un ERP moderne doit pouvoir être consulté (lecture) depuis une tablette ou un mobile en déplacement sans casser la lisibilité.

### ADR-04 : Remplacement local de Tailwind par du CSS Natif
- **Contexte** : Conflits de styles et classes inopérantes sur certains éléments.
- **Décision** : Mise en place d'un socle ERP Premium en pur CSS (Design Tokens, variables) plutôt que de s'appuyer exclusivement sur Tailwind CSS.
- **Justification** : Contrôle absolu sur les éléments très complexes comme les intersections de tableaux figés (sticky corners) et la gestion fine des z-index.