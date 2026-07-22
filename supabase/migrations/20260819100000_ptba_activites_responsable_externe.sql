-- ═══════════════════════════════════════════════════════════════════════════
-- PTBA — responsable externe (texte libre)
-- ═══════════════════════════════════════════════════════════════════════════
-- ptba_activites.responsable_id ne peut référencer qu'un utilisateur du
-- système (users.id) — mais une activité PTBA est souvent portée par un tiers
-- externe sans compte applicatif (ex: "Entreprise de construction XYZ",
-- "Fournisseur Équipement"). Ajout additif : responsable_externe (texte
-- libre), mutuellement exclusif avec responsable_id côté application (le
-- formulaire n'envoie jamais les deux à la fois) — pas de contrainte CHECK
-- d'exclusivité ici, cohérent avec le reste de cette table qui ne valide pas
-- ce genre de règle en base (cf. absence de contrainte sur wbs_id/logframe_ref_id).
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE public.ptba_activites ADD COLUMN IF NOT EXISTS responsable_externe text;
