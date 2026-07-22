-- ═══════════════════════════════════════════════════════════════════════════
-- WBS — responsable externe (texte libre), même correctif que PTBA
-- ═══════════════════════════════════════════════════════════════════════════
-- wbs_nodes.responsable_id ne peut référencer qu'un utilisateur du système
-- (users.id) — mais un nœud WBS est souvent porté par un tiers externe sans
-- compte applicatif (ex: "Entreprise de construction XYZ"). Ajout additif :
-- responsable_externe (texte libre), mutuellement exclusif avec
-- responsable_id côté application (cf. 20260819100000_ptba_activites_
-- responsable_externe.sql, même pattern exact appliqué ici).
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE public.wbs_nodes ADD COLUMN IF NOT EXISTS responsable_externe text;
