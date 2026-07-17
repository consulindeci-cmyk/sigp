-- Colonne "Organisation" du tableau Projets côté Super Admin : résout en une
-- seule requête l'organisation de chaque programme d'une page de résultats
-- (anti N+1 — même logique que fetchBatchAggregations côté frontend).
-- Même style de garde que organisation_programme_ids() : is_admin() OU
-- organisation propre de l'appelant, grantable à authenticated.
CREATE OR REPLACE FUNCTION public.programme_organisations_batch(p_programme_ids uuid[])
RETURNS TABLE (
  programme_id     uuid,
  organisation_id  uuid,
  organisation_nom text
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT pr.id, o.id, o.nom
  FROM public.programmes pr
  JOIN public.unites u ON u.id = pr.unite_id
  JOIN public.departements d ON d.id = u.departement_id
  JOIN public.directions dir ON dir.id = d.direction_id
  JOIN public.organisations o ON o.id = dir.organisation_id
  WHERE pr.id = ANY(p_programme_ids)
    AND (public.is_admin() OR dir.organisation_id = public.current_user_organisation_id());
$$;
