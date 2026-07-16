-- ═══════════════════════════════════════════════════════════════════════════
-- Module Commentaires (nouveau, jamais backé — TabComments.tsx tournait
-- entièrement sur des mocks statiques, cf. Gouvernance). Table transversale :
-- element_id/element_nom référencent librement n'importe quelle entité de
-- n'importe quel module (Budget, Risque, Livrable...), donc pas de FK directe
-- sur element_id (comme historique).
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE public.project_comments (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id   uuid NOT NULL REFERENCES public.projects(id),
  module       text NOT NULL CHECK (module IN (
    'Projet', 'PTBA', 'Activité', 'Budget', 'Source de financement',
    'Contrat', 'Décaissement', 'Risque', 'Livrable', 'Document', 'Rapport'
  )),
  element_id   text NOT NULL,
  element_nom  text NOT NULL DEFAULT '',
  auteur_id    uuid REFERENCES public.users(id),
  message      text NOT NULL,
  statut       text NOT NULL DEFAULT 'OUVERT' CHECK (statut IN ('OUVERT', 'EN_COURS', 'RESOLU', 'FERME', 'EN_ATTENTE')),
  priorite     text NOT NULL DEFAULT 'NORMALE' CHECK (priorite IN ('FAIBLE', 'NORMALE', 'HAUTE', 'URGENTE')),
  parent_id    uuid REFERENCES public.project_comments(id),
  piece_jointe text,
  mention      text,
  lu           boolean NOT NULL DEFAULT false,
  created_by   uuid REFERENCES public.users(id),
  updated_by   uuid REFERENCES public.users(id),
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  deleted_at   timestamptz
);
CREATE INDEX idx_project_comments_project ON public.project_comments(project_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_project_comments_parent  ON public.project_comments(parent_id) WHERE deleted_at IS NULL;

ALTER TABLE public.project_comments ENABLE ROW LEVEL SECURITY;

-- Lecture : tout rôle avec accès au projet (fonctionnalité collaborative,
-- contrairement aux autres modules pas réservée aux rôles de gestion).
DROP POLICY IF EXISTS project_comments_select ON public.project_comments;
CREATE POLICY project_comments_select ON public.project_comments
  FOR SELECT USING (
    deleted_at IS NULL
    AND (is_admin() OR project_organisation_id(project_id) = current_user_organisation_id())
  );

-- Écriture (création) : idem, ouvert à tout rôle du projet — commenter n'est
-- pas une action de gestion réservée.
DROP POLICY IF EXISTS project_comments_insert ON public.project_comments;
CREATE POLICY project_comments_insert ON public.project_comments
  FOR INSERT WITH CHECK (
    is_admin() OR project_organisation_id(project_id) = current_user_organisation_id()
  );

-- Modification/suppression réservées à l'auteur ou à un ADMIN.
DROP POLICY IF EXISTS project_comments_update ON public.project_comments;
CREATE POLICY project_comments_update ON public.project_comments
  FOR UPDATE USING (
    is_admin() OR auteur_id = current_app_user_id()
  );

DROP POLICY IF EXISTS project_comments_delete ON public.project_comments;
CREATE POLICY project_comments_delete ON public.project_comments
  FOR DELETE USING (
    is_admin() OR auteur_id = current_app_user_id()
  );
