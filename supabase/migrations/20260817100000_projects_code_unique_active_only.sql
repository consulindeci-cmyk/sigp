-- ═══════════════════════════════════════════════════════════════════════════
-- Réutilisation du code projet après soft delete
-- ═══════════════════════════════════════════════════════════════════════════
-- public.projects n'est créée par aucune migration trackée (table héritée,
-- comme public.users) — la contrainte UNIQUE existante sur `code` porte donc
-- un nom inconnu ici (probablement généré par Prisma, ex. projects_code_key).
-- Plutôt que de deviner ce nom, ce bloc le découvre dynamiquement (contrainte
-- UNIQUE via pg_constraint, ou index unique "nu" via pg_indexes) et le
-- supprime, avant de le remplacer par un index unique PARTIEL qui n'impose
-- l'unicité que parmi les projets actifs (deleted_at IS NULL) — un projet
-- soft-deleted (ex. PRJ-HT-EDU) ne bloque donc plus la recréation d'un
-- nouveau projet avec le même code.
--
-- projects-create (voir insertError.code === '23505' → 409 "Ce code projet
-- est déjà utilisé") n'a besoin d'aucun changement : il relayait déjà
-- fidèlement la violation de contrainte Postgres, quelle qu'elle soit — une
-- fois la contrainte remplacée par l'index partiel ci-dessous, ce chemin ne
-- se déclenche simplement plus pour un code dont l'unique porteur est
-- soft-deleted. Aucune vérification d'unicité côté frontend n'existe
-- aujourd'hui pour le code projet (contrairement à users-lookup-by-email) :
-- rien à ajuster de ce côté non plus.
-- ═══════════════════════════════════════════════════════════════════════════

DO $$
DECLARE
  r RECORD;
BEGIN
  -- Contraintes UNIQUE (table_constraints / pg_constraint) portant sur (code) seul.
  FOR r IN
    SELECT conname
    FROM pg_constraint
    WHERE conrelid = 'public.projects'::regclass
      AND contype = 'u'
      AND pg_get_constraintdef(oid) ILIKE '%(code)%'
  LOOP
    EXECUTE format('ALTER TABLE public.projects DROP CONSTRAINT %I', r.conname);
  END LOOP;

  -- Index uniques créés directement (sans contrainte associée) sur (code) seul.
  FOR r IN
    SELECT indexname
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND tablename = 'projects'
      AND indexdef ILIKE '%UNIQUE INDEX%'
      AND indexdef ILIKE '%(code)%'
      AND indexname <> 'idx_projects_code_unique_active'
  LOOP
    EXECUTE format('DROP INDEX IF EXISTS public.%I', r.indexname);
  END LOOP;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS idx_projects_code_unique_active
  ON public.projects (code)
  WHERE deleted_at IS NULL;
