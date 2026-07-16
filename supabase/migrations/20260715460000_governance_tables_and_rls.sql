-- ═══════════════════════════════════════════════════════════════════════════
-- GRAND CHANTIER — module Gouvernance & Acteurs (nouveau, jamais backé par
-- NestJS/Prisma — ProjectGovernanceTab.tsx tournait entièrement sur des mocks
-- statiques). Premières tables entièrement nouvelles de toute la migration :
-- pas de trace Prisma à répliquer, donc de vrais défauts Postgres partout
-- (contrairement au reste du schéma hérité, cf. mémoire feedback_prisma_db_defaults).
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── project_team_members (onglet "Équipe Projet") ────────────────────────────
CREATE TABLE public.project_team_members (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id  uuid NOT NULL REFERENCES public.projects(id),
  nom         text NOT NULL,
  prenom      text NOT NULL,
  role        text NOT NULL CHECK (role IN (
    'Responsable Projet', 'Sponsor', 'Chef de Composante', 'Expert Technique',
    'Expert Financier', 'Coordinateur', 'Chargé de Passation',
    'Assistant Administratif', 'Représentant Bailleur', 'Auditeur Externe', 'Membre'
  )),
  structure   text NOT NULL DEFAULT '',
  email       text NOT NULL,
  telephone   text NOT NULL DEFAULT '',
  statut      text NOT NULL DEFAULT 'Actif' CHECK (statut IN ('Actif', 'Inactif', 'En congé')),
  date_debut  date,
  created_by  uuid REFERENCES public.users(id),
  updated_by  uuid REFERENCES public.users(id),
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  deleted_at  timestamptz
);
CREATE INDEX idx_team_members_project ON public.project_team_members(project_id) WHERE deleted_at IS NULL;

-- ─── project_committee_members (onglet "Comité de Pilotage") ──────────────────
CREATE TABLE public.project_committee_members (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id     uuid NOT NULL REFERENCES public.projects(id),
  nom            text NOT NULL,
  prenom         text NOT NULL,
  fonction       text NOT NULL DEFAULT '',
  organisation   text NOT NULL DEFAULT '',
  type           text NOT NULL CHECK (type IN ('Comité de Pilotage', 'Comité Technique', 'Comité de Coordination')),
  president_role boolean NOT NULL DEFAULT false,
  statut         text NOT NULL DEFAULT 'Actif' CHECK (statut IN ('Actif', 'Inactif', 'En congé')),
  created_by     uuid REFERENCES public.users(id),
  updated_by     uuid REFERENCES public.users(id),
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now(),
  deleted_at     timestamptz
);
CREATE INDEX idx_committee_members_project ON public.project_committee_members(project_id) WHERE deleted_at IS NULL;

-- ─── project_stakeholders (onglets "Parties Prenantes" ET "Bailleurs" — ce
-- dernier est juste un filtre type = 'Bailleur' côté frontend, une seule table) ─
CREATE TABLE public.project_stakeholders (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id         uuid NOT NULL REFERENCES public.projects(id),
  organisation       text NOT NULL,
  type               text NOT NULL CHECK (type IN (
    'Bailleur', 'Gouvernement', 'ONG Partenaire', 'Secteur Privé', 'Société Civile', 'Bénéficiaire'
  )),
  representant       text NOT NULL DEFAULT '',
  email              text NOT NULL DEFAULT '',
  telephone          text NOT NULL DEFAULT '',
  niveau_engagement  text NOT NULL DEFAULT 'Moyen' CHECK (niveau_engagement IN ('Élevé', 'Moyen', 'Faible')),
  statut             text NOT NULL DEFAULT 'Actif' CHECK (statut IN ('Actif', 'Inactif', 'En congé')),
  created_by         uuid REFERENCES public.users(id),
  updated_by         uuid REFERENCES public.users(id),
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now(),
  deleted_at         timestamptz
);
CREATE INDEX idx_stakeholders_project ON public.project_stakeholders(project_id) WHERE deleted_at IS NULL;

-- ─── project_contacts (onglet "Contacts") ─────────────────────────────────────
CREATE TABLE public.project_contacts (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id    uuid NOT NULL REFERENCES public.projects(id),
  nom           text NOT NULL,
  prenom        text NOT NULL,
  organisation  text NOT NULL DEFAULT '',
  email         text NOT NULL DEFAULT '',
  telephone     text NOT NULL DEFAULT '',
  fonction      text NOT NULL DEFAULT '',
  categorie     text NOT NULL CHECK (categorie IN ('Urgence', 'Technique', 'Administratif', 'Bailleur')),
  created_by    uuid REFERENCES public.users(id),
  updated_by    uuid REFERENCES public.users(id),
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  deleted_at    timestamptz
);
CREATE INDEX idx_contacts_project ON public.project_contacts(project_id) WHERE deleted_at IS NULL;

-- ═══════════════════════════════════════════════════════════════════════════
-- RLS — même schéma que risques_rls.sql : lecture même organisation, écriture
-- réelle via Edge Functions (service_role), policies directes en filet de
-- sécurité.
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE public.project_team_members      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_committee_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_stakeholders      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_contacts          ENABLE ROW LEVEL SECURITY;

-- team_members
CREATE POLICY project_team_members_select ON public.project_team_members
  FOR SELECT USING (
    deleted_at IS NULL
    AND (is_admin() OR project_organisation_id(project_id) = current_user_organisation_id())
  );
CREATE POLICY project_team_members_insert ON public.project_team_members
  FOR INSERT WITH CHECK (
    current_user_role() IN ('COORDINATEUR', 'CHARGE_PROGRAMME', 'ADMIN')
    AND (is_admin() OR project_organisation_id(project_id) = current_user_organisation_id())
  );
CREATE POLICY project_team_members_update ON public.project_team_members
  FOR UPDATE USING (
    current_user_role() IN ('COORDINATEUR', 'CHARGE_PROGRAMME', 'ADMIN')
    AND (is_admin() OR project_organisation_id(project_id) = current_user_organisation_id())
  );
CREATE POLICY project_team_members_delete ON public.project_team_members
  FOR DELETE USING (current_user_role() = 'ADMIN');

-- committee_members
CREATE POLICY project_committee_members_select ON public.project_committee_members
  FOR SELECT USING (
    deleted_at IS NULL
    AND (is_admin() OR project_organisation_id(project_id) = current_user_organisation_id())
  );
CREATE POLICY project_committee_members_insert ON public.project_committee_members
  FOR INSERT WITH CHECK (
    current_user_role() IN ('COORDINATEUR', 'CHARGE_PROGRAMME', 'ADMIN')
    AND (is_admin() OR project_organisation_id(project_id) = current_user_organisation_id())
  );
CREATE POLICY project_committee_members_update ON public.project_committee_members
  FOR UPDATE USING (
    current_user_role() IN ('COORDINATEUR', 'CHARGE_PROGRAMME', 'ADMIN')
    AND (is_admin() OR project_organisation_id(project_id) = current_user_organisation_id())
  );
CREATE POLICY project_committee_members_delete ON public.project_committee_members
  FOR DELETE USING (current_user_role() = 'ADMIN');

-- stakeholders
CREATE POLICY project_stakeholders_select ON public.project_stakeholders
  FOR SELECT USING (
    deleted_at IS NULL
    AND (is_admin() OR project_organisation_id(project_id) = current_user_organisation_id())
  );
CREATE POLICY project_stakeholders_insert ON public.project_stakeholders
  FOR INSERT WITH CHECK (
    current_user_role() IN ('COORDINATEUR', 'CHARGE_PROGRAMME', 'ADMIN')
    AND (is_admin() OR project_organisation_id(project_id) = current_user_organisation_id())
  );
CREATE POLICY project_stakeholders_update ON public.project_stakeholders
  FOR UPDATE USING (
    current_user_role() IN ('COORDINATEUR', 'CHARGE_PROGRAMME', 'ADMIN')
    AND (is_admin() OR project_organisation_id(project_id) = current_user_organisation_id())
  );
CREATE POLICY project_stakeholders_delete ON public.project_stakeholders
  FOR DELETE USING (current_user_role() = 'ADMIN');

-- contacts
CREATE POLICY project_contacts_select ON public.project_contacts
  FOR SELECT USING (
    deleted_at IS NULL
    AND (is_admin() OR project_organisation_id(project_id) = current_user_organisation_id())
  );
CREATE POLICY project_contacts_insert ON public.project_contacts
  FOR INSERT WITH CHECK (
    current_user_role() IN ('COORDINATEUR', 'CHARGE_PROGRAMME', 'ADMIN')
    AND (is_admin() OR project_organisation_id(project_id) = current_user_organisation_id())
  );
CREATE POLICY project_contacts_update ON public.project_contacts
  FOR UPDATE USING (
    current_user_role() IN ('COORDINATEUR', 'CHARGE_PROGRAMME', 'ADMIN')
    AND (is_admin() OR project_organisation_id(project_id) = current_user_organisation_id())
  );
CREATE POLICY project_contacts_delete ON public.project_contacts
  FOR DELETE USING (current_user_role() = 'ADMIN');
