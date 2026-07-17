-- Page Super Admin "Organisations" : une seule fonction agrégée plutôt que du
-- N+1 côté client (leçon retenue de l'optimisation useProjects/getBatchAggregations).
-- Traverse la hiérarchie organisationnelle pour compter les projets actifs
-- (projects → programmes → unites → departements → directions), là où le
-- nombre d'utilisateurs est direct (users.organisation_id).
--
-- SECURITY DEFINER + EXECUTE restreint à service_role uniquement : cette
-- fonction renvoie des données inter-organisations (emails d'org_admin de
-- TOUTES les organisations) — jamais appelable directement par un client
-- anon/authenticated via PostgREST, seulement depuis l'Edge Function
-- organisations-list (gate SUPER_ADMIN applicatif + client service_role).
CREATE OR REPLACE FUNCTION public.organisation_overview()
RETURNS TABLE (
  id                    uuid,
  nom                   text,
  adresse               text,
  ville                 text,
  pays                  text,
  telephone             text,
  email                 text,
  site_web              text,
  statut                text,
  created_at            timestamptz,
  org_admin_id          uuid,
  org_admin_nom         text,
  org_admin_prenom      text,
  org_admin_email       text,
  org_admin_count       bigint,
  projets_actifs_count  bigint,
  utilisateurs_count    bigint
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT
    o.id,
    o.nom,
    o.adresse,
    o.ville,
    o.pays,
    o.telephone,
    o.email,
    o.site_web,
    o.statut,
    o.created_at,
    admin_first.id,
    admin_first.nom,
    admin_first.prenom,
    admin_first.email,
    COALESCE(admin_count.cnt, 0),
    COALESCE(proj.cnt, 0),
    COALESCE(usr.cnt, 0)
  FROM public.organisations o
  LEFT JOIN LATERAL (
    SELECT u.id, u.nom, u.prenom, u.email
    FROM public.users u
    WHERE u.organisation_id = o.id AND u.role = 'ADMIN' AND u.deleted_at IS NULL
    ORDER BY u.created_at ASC
    LIMIT 1
  ) admin_first ON true
  LEFT JOIN LATERAL (
    SELECT count(*) AS cnt
    FROM public.users u
    WHERE u.organisation_id = o.id AND u.role = 'ADMIN' AND u.deleted_at IS NULL
  ) admin_count ON true
  LEFT JOIN LATERAL (
    SELECT count(*) AS cnt
    FROM public.projects p
    JOIN public.programmes  pr  ON pr.id  = p.programme_id
    JOIN public.unites      u   ON u.id   = pr.unite_id
    JOIN public.departements d  ON d.id   = u.departement_id
    JOIN public.directions  dir ON dir.id = d.direction_id
    WHERE dir.organisation_id = o.id AND p.statut = 'ACTIF' AND p.deleted_at IS NULL
  ) proj ON true
  LEFT JOIN LATERAL (
    SELECT count(*) AS cnt
    FROM public.users u
    WHERE u.organisation_id = o.id AND u.deleted_at IS NULL
  ) usr ON true
  ORDER BY o.created_at DESC;
$$;

REVOKE EXECUTE ON FUNCTION public.organisation_overview() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.organisation_overview() FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.organisation_overview() TO service_role;
