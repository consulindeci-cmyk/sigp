-- ═══════════════════════════════════════════════════════════════════════════
-- PILOTE MIGRATION 100% SUPABASE — Étape 1 : Auth + module Projets
-- ═══════════════════════════════════════════════════════════════════════════
-- Ce script est idempotent (IF NOT EXISTS / OR REPLACE partout) et NE SUPPRIME
-- RIEN. Il peut être appliqué sur la base Supabase existante sans casser le
-- backend NestJS actuellement en production (qui se connecte en direct via
-- DATABASE_URL avec un rôle propriétaire des tables → RLS ne s'applique pas
-- à cette connexion, seulement aux appels via l'API Supabase/PostgREST et au
-- SDK supabase-js).
--
-- Portée : uniquement la hiérarchie organisationnelle (organisations →
-- directions → departements → unites → programmes) + la table projects +
-- le mapping vers Supabase Auth. Les 30 autres tables NE sont PAS touchées
-- ici — elles restent accessibles uniquement via NestJS jusqu'à la phase 2.

-- ───────────────────────────────────────────────────────────────────────────
-- 1. Mapping Supabase Auth ↔ table users existante
-- ───────────────────────────────────────────────────────────────────────────
-- On NE réutilise PAS users.id comme clé Supabase Auth : l'API Admin GoTrue
-- génère toujours son propre UUID à la création d'un compte, et users.id est
-- déjà référencé par des centaines de clés étrangères dans les 36 tables
-- (risques, budgets, PTBA, documents…). Ajouter une colonne de mapping évite
-- toute migration de données sur ces tables.

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS auth_user_id uuid UNIQUE;

COMMENT ON COLUMN public.users.auth_user_id IS
  'Référence vers auth.users.id (Supabase Auth). NULL tant que le compte n''a pas encore été réinitialisé/migré (voir scripts/migrate-users-to-supabase-auth.ts).';

CREATE INDEX IF NOT EXISTS idx_users_auth_user_id ON public.users (auth_user_id);

-- ───────────────────────────────────────────────────────────────────────────
-- 2. Fonctions helper (SECURITY DEFINER — contournent RLS pour leurs
--    propres requêtes internes, exécutées avec les privilèges du
--    propriétaire de la fonction, jamais exposées directement au client)
-- ───────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.current_app_user_id()
RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT id FROM public.users WHERE auth_user_id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.current_user_organisation_id()
RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT organisation_id FROM public.users WHERE auth_user_id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT role::text FROM public.users WHERE auth_user_id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT COALESCE((SELECT role = 'ADMIN' FROM public.users WHERE auth_user_id = auth.uid()), false);
$$;

-- Remonte la chaîne hiérarchique jusqu'à l'organisation, à chaque niveau.
CREATE OR REPLACE FUNCTION public.unite_organisation_id(p_unite_id uuid)
RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT dir.organisation_id
  FROM public.unites u
  JOIN public.departements d   ON d.id = u.departement_id
  JOIN public.directions dir   ON dir.id = d.direction_id
  WHERE u.id = p_unite_id;
$$;

CREATE OR REPLACE FUNCTION public.programme_organisation_id(p_programme_id uuid)
RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT public.unite_organisation_id(pr.unite_id)
  FROM public.programmes pr
  WHERE pr.id = p_programme_id;
$$;

-- programme_id est nullable sur projects (cf. audit Phase 18.2 : un projet
-- sans programme existe potentiellement déjà) → retourne NULL dans ce cas,
-- ce qui exclut ces lignes de toute policy "= current_user_organisation_id()"
-- pour un non-ADMIN (comportement voulu : un projet orphelin ne doit être
-- visible que par ADMIN, jamais par un utilisateur d'une autre organisation).
CREATE OR REPLACE FUNCTION public.project_organisation_id(p_project_id uuid)
RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT public.programme_organisation_id(p.programme_id)
  FROM public.projects p
  WHERE p.id = p_project_id;
$$;

-- ───────────────────────────────────────────────────────────────────────────
-- 3. RLS — hiérarchie organisationnelle (lecture seule pour les non-ADMIN,
--    nécessaire pour que le frontend puisse peupler le sélecteur de
--    programme dans le formulaire "Nouveau projet" — absent côté NestJS,
--    cf. audit Phase 18.2, Critique #3)
-- ───────────────────────────────────────────────────────────────────────────

ALTER TABLE public.organisations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS organisations_select ON public.organisations;
CREATE POLICY organisations_select ON public.organisations
  FOR SELECT USING (is_admin() OR id = current_user_organisation_id());

ALTER TABLE public.directions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS directions_select ON public.directions;
CREATE POLICY directions_select ON public.directions
  FOR SELECT USING (is_admin() OR organisation_id = current_user_organisation_id());

ALTER TABLE public.departements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS departements_select ON public.departements;
CREATE POLICY departements_select ON public.departements
  FOR SELECT USING (
    is_admin()
    OR direction_id IN (SELECT id FROM public.directions WHERE organisation_id = current_user_organisation_id())
  );

ALTER TABLE public.unites ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS unites_select ON public.unites;
CREATE POLICY unites_select ON public.unites
  FOR SELECT USING (is_admin() OR unite_organisation_id(id) = current_user_organisation_id());

ALTER TABLE public.programmes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS programmes_select ON public.programmes;
CREATE POLICY programmes_select ON public.programmes
  FOR SELECT USING (is_admin() OR programme_organisation_id(id) = current_user_organisation_id());

-- ───────────────────────────────────────────────────────────────────────────
-- 4. RLS — users (lecture de son propre profil uniquement, ou tout pour ADMIN)
-- ───────────────────────────────────────────────────────────────────────────

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS users_select_self_or_admin ON public.users;
CREATE POLICY users_select_self_or_admin ON public.users
  FOR SELECT USING (is_admin() OR auth_user_id = auth.uid());

-- ───────────────────────────────────────────────────────────────────────────
-- 5. RLS — projects (reproduit ProjectAccessGuard + les rôles du controller
--    NestJS : lecture 6 rôles scoping org, création COORDINATEUR/ADMIN,
--    modification COORDINATEUR/ADMIN, suppression ADMIN uniquement)
-- ───────────────────────────────────────────────────────────────────────────

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS projects_select ON public.projects;
CREATE POLICY projects_select ON public.projects
  FOR SELECT USING (
    deleted_at IS NULL
    AND (is_admin() OR project_organisation_id(id) = current_user_organisation_id())
  );

-- INSERT/UPDATE/DELETE réels passent par les Edge Functions (service_role,
-- qui bypass RLS) — ces policies servent de filet de sécurité si jamais un
-- appel direct supabase-js était tenté depuis le frontend par erreur.
DROP POLICY IF EXISTS projects_insert ON public.projects;
CREATE POLICY projects_insert ON public.projects
  FOR INSERT WITH CHECK (
    current_user_role() IN ('COORDINATEUR', 'ADMIN')
    AND (is_admin() OR programme_organisation_id(programme_id) = current_user_organisation_id())
  );

DROP POLICY IF EXISTS projects_update ON public.projects;
CREATE POLICY projects_update ON public.projects
  FOR UPDATE USING (
    current_user_role() IN ('COORDINATEUR', 'ADMIN')
    AND (is_admin() OR project_organisation_id(id) = current_user_organisation_id())
  );

DROP POLICY IF EXISTS projects_delete ON public.projects;
CREATE POLICY projects_delete ON public.projects
  FOR DELETE USING (current_user_role() = 'ADMIN');

-- ───────────────────────────────────────────────────────────────────────────
-- 6. RLS — historique (journal d'audit) : lecture ADMIN/AUDITEUR de la même
--    organisation, écriture réservée aux Edge Functions (service_role)
-- ───────────────────────────────────────────────────────────────────────────

ALTER TABLE public.historique ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS historique_select ON public.historique;
CREATE POLICY historique_select ON public.historique
  FOR SELECT USING (
    is_admin()
    OR (
      current_user_role() = 'AUDITEUR'
      AND project_id IS NOT NULL
      AND project_organisation_id(project_id) = current_user_organisation_id()
    )
  );
-- Aucune policy INSERT/UPDATE/DELETE pour les rôles authentifiés normaux :
-- seules les Edge Functions (clé service_role, qui bypass RLS) écrivent ici.
