-- Filtre Organisation (SUPER_ADMIN) sur le module Documents : un niveau plus
-- loin que organisation_programme_ids() (Projets), résout directement les
-- project_id d'une organisation. Réutilisable par tout futur module filtré
-- par project_id (Rapports, etc.), pas seulement Documents.
-- Même garde que organisation_programme_ids() : is_admin() OU organisation
-- propre de l'appelant, grantable à authenticated.
CREATE OR REPLACE FUNCTION public.organisation_project_ids(p_organisation_id uuid)
RETURNS SETOF uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT p.id
  FROM public.projects p
  JOIN public.programmes  pr  ON pr.id  = p.programme_id
  JOIN public.unites      u   ON u.id   = pr.unite_id
  JOIN public.departements d  ON d.id   = u.departement_id
  JOIN public.directions  dir ON dir.id = d.direction_id
  WHERE dir.organisation_id = p_organisation_id
    AND p.deleted_at IS NULL
    AND (public.is_admin() OR p_organisation_id = public.current_user_organisation_id());
$$;
