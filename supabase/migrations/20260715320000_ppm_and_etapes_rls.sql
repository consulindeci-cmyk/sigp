-- ═══════════════════════════════════════════════════════════════════════════
-- PILOTE MIGRATION 100% SUPABASE — module PPM (marchés publics) + PPM-Étapes
-- ═══════════════════════════════════════════════════════════════════════════
-- Traités ensemble : une étape n'existe jamais sans marché parent (marche_id
-- NOT NULL, FK cascade), même logique de regroupement que Budget Versions/Lignes.
--
-- Différence notable trouvée : `ppm_etapes` N'A PAS de colonne `deleted_at` —
-- contrairement à TOUTES les tables migrées jusqu'ici, `PpmEtapeRepository.
-- softDelete()` fait un vrai DELETE physique (`prisma.ppmEtape.delete()`).
-- Reproduit fidèlement : pas de "deleted_at IS NULL" dans la policy SELECT,
-- et l'Edge Function de suppression fait un DELETE réel, pas un soft delete.

CREATE OR REPLACE FUNCTION public.ppm_marche_organisation_id(p_marche_id uuid)
RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT project_organisation_id(pm.project_id)
  FROM public.ppm_marches pm
  WHERE pm.id = p_marche_id;
$$;

-- ───────────────────────────────────────────────────────────────────────────
-- ppm_marches — pattern standard (COORDINATEUR/CHARGE_PROGRAMME/ADMIN en
-- écriture ; pas de FINANCIER ici, la passation de marchés n'est pas de son
-- ressort contrairement au budget)
-- ───────────────────────────────────────────────────────────────────────────
ALTER TABLE public.ppm_marches ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS ppm_marches_select ON public.ppm_marches;
CREATE POLICY ppm_marches_select ON public.ppm_marches
  FOR SELECT USING (
    deleted_at IS NULL
    AND (is_admin() OR project_organisation_id(project_id) = current_user_organisation_id())
  );

DROP POLICY IF EXISTS ppm_marches_insert ON public.ppm_marches;
CREATE POLICY ppm_marches_insert ON public.ppm_marches
  FOR INSERT WITH CHECK (
    current_user_role() IN ('COORDINATEUR', 'CHARGE_PROGRAMME', 'ADMIN')
    AND (is_admin() OR project_organisation_id(project_id) = current_user_organisation_id())
  );

DROP POLICY IF EXISTS ppm_marches_update ON public.ppm_marches;
CREATE POLICY ppm_marches_update ON public.ppm_marches
  FOR UPDATE USING (
    current_user_role() IN ('COORDINATEUR', 'CHARGE_PROGRAMME', 'ADMIN')
    AND (is_admin() OR project_organisation_id(project_id) = current_user_organisation_id())
  );

DROP POLICY IF EXISTS ppm_marches_delete ON public.ppm_marches;
CREATE POLICY ppm_marches_delete ON public.ppm_marches
  FOR DELETE USING (current_user_role() = 'ADMIN');

-- ───────────────────────────────────────────────────────────────────────────
-- ppm_etapes — PAS de deleted_at, PAS de created_by/updated_by
-- ───────────────────────────────────────────────────────────────────────────
ALTER TABLE public.ppm_etapes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS ppm_etapes_select ON public.ppm_etapes;
CREATE POLICY ppm_etapes_select ON public.ppm_etapes
  FOR SELECT USING (
    is_admin() OR ppm_marche_organisation_id(marche_id) = current_user_organisation_id()
  );

DROP POLICY IF EXISTS ppm_etapes_insert ON public.ppm_etapes;
CREATE POLICY ppm_etapes_insert ON public.ppm_etapes
  FOR INSERT WITH CHECK (
    current_user_role() IN ('COORDINATEUR', 'CHARGE_PROGRAMME', 'ADMIN')
    AND (is_admin() OR ppm_marche_organisation_id(marche_id) = current_user_organisation_id())
  );

DROP POLICY IF EXISTS ppm_etapes_update ON public.ppm_etapes;
CREATE POLICY ppm_etapes_update ON public.ppm_etapes
  FOR UPDATE USING (
    current_user_role() IN ('COORDINATEUR', 'CHARGE_PROGRAMME', 'ADMIN')
    AND (is_admin() OR ppm_marche_organisation_id(marche_id) = current_user_organisation_id())
  );

-- Suppression réelle (DELETE physique, pas de deleted_at) : ADMIN seul, comme
-- ailleurs, mais ici ça retire vraiment la ligne de la base.
DROP POLICY IF EXISTS ppm_etapes_delete ON public.ppm_etapes;
CREATE POLICY ppm_etapes_delete ON public.ppm_etapes
  FOR DELETE USING (current_user_role() = 'ADMIN');
