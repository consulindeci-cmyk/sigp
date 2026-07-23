-- ═══════════════════════════════════════════════════════════════════════════
-- Réutilisation du code de ligne budgétaire après soft delete
-- ═══════════════════════════════════════════════════════════════════════════
-- Même bug, même correctif que sur projects.code
-- (20260817100000_projects_code_unique_active_only.sql) : public.budget_lignes
-- n'est créée par aucune migration trackée (table héritée) — la contrainte
-- UNIQUE existante sur (version_id, code_ligne) porte donc un nom inconnu ici
-- (probablement généré par Prisma). budget-lines-delete fait un vrai
-- soft-delete (UPDATE deleted_at), mais la contrainte UNIQUE d'origine ne
-- filtre pas deleted_at IS NULL : supprimer une ligne puis tenter de la
-- recréer avec le même code_ligne dans la même version échoue avec 23505
-- ("Une ligne avec ce code existe déjà dans cette version"), alors que
-- l'unique porteuse du code est déjà soft-deleted.
--
-- Découverte dynamique de la contrainte/index existant (via pg_constraint ou
-- pg_indexes, quel que soit son nom), suppression, puis remplacement par un
-- index unique PARTIEL qui n'impose l'unicité que parmi les lignes actives.
--
-- budget-lines-create n'a besoin d'aucun changement : son handling de
-- insertError.code === '23505' relayait déjà fidèlement la violation de
-- contrainte Postgres, quelle qu'elle soit — une fois la contrainte
-- remplacée par l'index partiel ci-dessous, ce chemin ne se déclenche
-- simplement plus pour un code dont l'unique porteur est soft-deleted.
-- wbs_id n'a volontairement aucune contrainte d'unicité : plusieurs lignes
-- budgétaires (catégories/bailleurs différents) peuvent légitimement se
-- rattacher au même nœud WBS.
-- ═══════════════════════════════════════════════════════════════════════════

DO $$
DECLARE
  r RECORD;
BEGIN
  -- Contraintes UNIQUE (pg_constraint) portant sur code_ligne (seul ou combiné
  -- à version_id).
  FOR r IN
    SELECT conname
    FROM pg_constraint
    WHERE conrelid = 'public.budget_lignes'::regclass
      AND contype = 'u'
      AND pg_get_constraintdef(oid) ILIKE '%code_ligne%'
  LOOP
    EXECUTE format('ALTER TABLE public.budget_lignes DROP CONSTRAINT %I', r.conname);
  END LOOP;

  -- Index uniques créés directement (sans contrainte associée) sur code_ligne.
  FOR r IN
    SELECT indexname
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND tablename = 'budget_lignes'
      AND indexdef ILIKE '%UNIQUE INDEX%'
      AND indexdef ILIKE '%code_ligne%'
      AND indexname <> 'idx_budget_lignes_code_unique_active'
  LOOP
    EXECUTE format('DROP INDEX IF EXISTS public.%I', r.indexname);
  END LOOP;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS idx_budget_lignes_code_unique_active
  ON public.budget_lignes (version_id, code_ligne)
  WHERE deleted_at IS NULL;
