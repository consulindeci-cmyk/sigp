-- ═══════════════════════════════════════════════════════════════════════════
-- Chantier interconnexion — Vague 2 : liaison PTBA ⟷ Marchés (many-to-many)
-- ═══════════════════════════════════════════════════════════════════════════
-- Un marché du plan de passation (ppm_marches) peut couvrir plusieurs
-- activités PTBA, et une activité peut être livrée par plusieurs lots — d'où
-- une table de jonction plutôt qu'une FK simple sur l'une ou l'autre table.
-- Cohérence de projet (marché et activité du même projet) vérifiée dans
-- l'Edge Function ppm-activites-set, pas en RLS — logique métier inter-tables,
-- même parti pris que pour wbs_id/logframe_ref_id sur ptba_activites.

CREATE TABLE IF NOT EXISTS public.ptba_activite_marches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  marche_id uuid NOT NULL REFERENCES public.ppm_marches(id) ON DELETE CASCADE,
  activite_id uuid NOT NULL REFERENCES public.ptba_activites(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  UNIQUE (marche_id, activite_id)
);

CREATE INDEX IF NOT EXISTS idx_ptba_activite_marches_marche ON public.ptba_activite_marches (marche_id);
CREATE INDEX IF NOT EXISTS idx_ptba_activite_marches_activite ON public.ptba_activite_marches (activite_id);

ALTER TABLE public.ptba_activite_marches ENABLE ROW LEVEL SECURITY;

-- Org résolue via le marché (ppm_marche_organisation_id déjà défini dans
-- 20260715320000_ppm_and_etapes_rls.sql) — marché et activité appartiennent
-- toujours au même projet, donc à la même organisation.
DROP POLICY IF EXISTS ptba_activite_marches_select ON public.ptba_activite_marches;
CREATE POLICY ptba_activite_marches_select ON public.ptba_activite_marches
  FOR SELECT USING (
    is_admin() OR ppm_marche_organisation_id(marche_id) = current_user_organisation_id()
  );

DROP POLICY IF EXISTS ptba_activite_marches_insert ON public.ptba_activite_marches;
CREATE POLICY ptba_activite_marches_insert ON public.ptba_activite_marches
  FOR INSERT WITH CHECK (
    current_user_role() IN ('COORDINATEUR', 'CHARGE_PROGRAMME', 'ADMIN')
    AND (is_admin() OR ppm_marche_organisation_id(marche_id) = current_user_organisation_id())
  );

DROP POLICY IF EXISTS ptba_activite_marches_delete ON public.ptba_activite_marches;
CREATE POLICY ptba_activite_marches_delete ON public.ptba_activite_marches
  FOR DELETE USING (
    current_user_role() IN ('COORDINATEUR', 'CHARGE_PROGRAMME', 'ADMIN')
    AND (is_admin() OR ppm_marche_organisation_id(marche_id) = current_user_organisation_id())
  );
