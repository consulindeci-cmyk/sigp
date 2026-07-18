-- organisation_overview() étendue avec devise_defaut/identifiant_fiscal
-- (nouveaux champs du formulaire Organisation) — DROP explicite requis,
-- CREATE OR REPLACE ne permet pas de changer la liste des colonnes de
-- retour d'une fonction RETURNS TABLE. max_projects volontairement absent
-- (quota invisible, jamais exposé en UI).
DROP FUNCTION IF EXISTS public.organisation_overview();

CREATE FUNCTION public.organisation_overview()
RETURNS TABLE (
  id                    uuid,
  nom                   text,
  adresse               text,
  ville                 text,
  pays                  text,
  telephone             text,
  email                 text,
  site_web              text,
  devise_defaut         text,
  identifiant_fiscal    text,
  statut                text,
  created_at            timestamptz,
  org_admin_id          uuid,
  org_admin_nom         text,
  org_admin_prenom      text,
  org_admin_email       text,
  org_admin_count       bigint,
  projets_actifs_count  bigint,
  budget_total_actif    numeric,
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
    o.devise_defaut,
    o.identifiant_fiscal,
    o.statut,
    o.created_at,
    admin_first.id,
    admin_first.nom,
    admin_first.prenom,
    admin_first.email,
    COALESCE(admin_count.cnt, 0),
    COALESCE(proj.cnt, 0),
    COALESCE(proj.budget_sum, 0),
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
    SELECT count(*) AS cnt, SUM(p.budget_total) AS budget_sum
    FROM public.projects p
    JOIN public.programmes  pr  ON pr.id  = p.programme_id
    JOIN public.unites      u   ON u.id   = pr.unite_id
    JOIN public.departements d  ON d.id   = u.departement_id
    JOIN public.directions  dir ON dir.id = d.direction_id
    WHERE dir.organisation_id = o.id AND p.statut = 'EN_COURS' AND p.deleted_at IS NULL
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
