-- ═══════════════════════════════════════════════════════════════════════════
-- Module Paramètres Projet (nouveau, jamais backé — TabSettings.tsx tournait
-- entièrement sur des mocks statiques, dernier des 5 onglets jamais implémentés).
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE public.project_settings (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id     uuid NOT NULL REFERENCES public.projects(id),
  code_param     text NOT NULL,
  categorie      text NOT NULL CHECK (categorie IN (
    'Général', 'Organisation', 'Notifications', 'Validation',
    'Sécurité', 'Affichage', 'Archivage'
  )),
  nom            text NOT NULL,
  description    text NOT NULL DEFAULT '',
  valeur         text NOT NULL DEFAULT '',
  valeur_defaut  text NOT NULL DEFAULT '',
  type_valeur    text NOT NULL DEFAULT 'TEXTE' CHECK (type_valeur IN ('TEXTE', 'NOMBRE', 'BOOLEEN', 'DATE', 'LISTE', 'JSON')),
  requis         boolean NOT NULL DEFAULT false,
  modifiable     boolean NOT NULL DEFAULT true,
  statut         text NOT NULL DEFAULT 'ACTIF' CHECK (statut IN ('ACTIF', 'INACTIF', 'EN_ATTENTE', 'OBSOLETE')),
  modifie_par    uuid REFERENCES public.users(id),
  created_by     uuid REFERENCES public.users(id),
  updated_by     uuid REFERENCES public.users(id),
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now(),
  deleted_at     timestamptz,
  UNIQUE (project_id, code_param)
);
CREATE INDEX idx_project_settings_project ON public.project_settings(project_id) WHERE deleted_at IS NULL;

ALTER TABLE public.project_settings ENABLE ROW LEVEL SECURITY;

-- Lecture : même organisation (tous rôles avec accès au projet).
DROP POLICY IF EXISTS project_settings_select ON public.project_settings;
CREATE POLICY project_settings_select ON public.project_settings
  FOR SELECT USING (
    deleted_at IS NULL
    AND (is_admin() OR project_organisation_id(project_id) = current_user_organisation_id())
  );

-- Écriture : configuration projet = action de gestion, mêmes rôles que
-- Gouvernance (pas FINANCIER, ce n'est pas un paramètre financier).
DROP POLICY IF EXISTS project_settings_insert ON public.project_settings;
CREATE POLICY project_settings_insert ON public.project_settings
  FOR INSERT WITH CHECK (
    current_user_role() IN ('COORDINATEUR', 'CHARGE_PROGRAMME', 'ADMIN')
    AND (is_admin() OR project_organisation_id(project_id) = current_user_organisation_id())
  );

DROP POLICY IF EXISTS project_settings_update ON public.project_settings;
CREATE POLICY project_settings_update ON public.project_settings
  FOR UPDATE USING (
    current_user_role() IN ('COORDINATEUR', 'CHARGE_PROGRAMME', 'ADMIN')
    AND (is_admin() OR project_organisation_id(project_id) = current_user_organisation_id())
  );

DROP POLICY IF EXISTS project_settings_delete ON public.project_settings;
CREATE POLICY project_settings_delete ON public.project_settings
  FOR DELETE USING (current_user_role() = 'ADMIN');
