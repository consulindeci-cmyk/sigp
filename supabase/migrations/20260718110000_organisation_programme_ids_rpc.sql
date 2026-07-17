-- Page Projets côté Super Admin : filtre par organisation. projects n'a pas
-- de colonne organisation_id directe (uniquement programme_id, remontant
-- programmes → unites → departements → directions → organisations) — cette
-- fonction résout en une seule requête les programme_id d'une organisation
-- donnée, à utiliser ensuite via `.in('programme_id', ids)` côté frontend.
--
-- Contrairement à organisation_overview() (réservée service_role), celle-ci
-- suit le même style que project_organisation_id()/programme_organisation_id() :
-- SECURITY DEFINER + vérification interne (is_admin() OR organisation propre
-- de l'appelant), grantable à authenticated — un org_admin peut l'appeler
-- pour SA PROPRE organisation (résultat déjà visible via les policies
-- programmes_select/directions_select existantes, aucune fuite), un
-- SUPER_ADMIN peut l'appeler pour n'importe quelle organisation. Un appel
-- avec un organisation_id qui n'est ni le sien ni SUPER_ADMIN renvoie un
-- ensemble vide (filtrage silencieux, pas d'erreur).
CREATE OR REPLACE FUNCTION public.organisation_programme_ids(p_organisation_id uuid)
RETURNS SETOF uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT pr.id
  FROM public.programmes pr
  JOIN public.unites u ON u.id = pr.unite_id
  JOIN public.departements d ON d.id = u.departement_id
  JOIN public.directions dir ON dir.id = d.direction_id
  WHERE dir.organisation_id = p_organisation_id
    AND (public.is_admin() OR p_organisation_id = public.current_user_organisation_id());
$$;
