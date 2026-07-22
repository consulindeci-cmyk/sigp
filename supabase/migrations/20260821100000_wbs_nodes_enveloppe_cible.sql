-- ═══════════════════════════════════════════════════════════════════════════
-- WBS — Enveloppe Budgétaire Cible / Plafond (composantes racine)
-- ═══════════════════════════════════════════════════════════════════════════
-- Plafond fixé par le bailleur pour l'ensemble d'une composante — distinct de
-- budget_alloue (rollup automatique des activités PTBA rattachées, lecture
-- seule, cf. simplification du formulaire WBS). enveloppe_cible est au
-- contraire une VRAIE saisie manuelle, optionnelle, comparée dans la Matrice
-- PTBA (PTBAComponentSubtotalRow) au total réellement planifié pour détecter
-- un dépassement.
--
-- N'a de sens que pour les composantes racine (parent_id IS NULL) — pas de
-- contrainte CHECK ici pour l'imposer (cohérent avec le reste de cette table,
-- qui ne valide pas ce genre de règle en base) : l'UI (WBSNodeForm) ne
-- propose ce champ que pour les nœuds racine.
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE public.wbs_nodes ADD COLUMN IF NOT EXISTS enveloppe_cible numeric;
