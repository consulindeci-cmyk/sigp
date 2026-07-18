-- ═══════════════════════════════════════════════════════════════════════════
-- Chantier interconnexion — Vague 2 : synchronisation Décaissements/Contrats → Budget
-- ═══════════════════════════════════════════════════════════════════════════
-- Constat de l'audit : budget_lignes.montant_engage/montant_paye n'étaient
-- modifiables QUE manuellement (budget-lines-update), sans lien avec les
-- vraies transactions (disbursements.contract_id/budget_ligne_id existent
-- déjà mais ne sont jamais agrégés) — risque de désynchronisation silencieuse.
-- Cette migration ajoute : le chaînon manquant contracts.budget_ligne_id (les
-- 3 autres champs d'imputation de contracts restent des placeholders notes/
-- meta, cf. ContractMeta), le suivi de devise par ligne/décaissement, une
-- table de taux de change minimale, et une fonction de recalcul appelée par
-- les Edge Functions disbursements-*/contracts-* après chaque mutation.

-- ── Chaînon manquant : un contrat peut être imputé à une ligne budgétaire ──
ALTER TABLE public.contracts
  ADD COLUMN IF NOT EXISTS budget_ligne_id uuid REFERENCES public.budget_lignes(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_contracts_budget_ligne ON public.contracts (budget_ligne_id);

-- ── Devise par ligne/décaissement (contracts.devise existe déjà) ──────────
ALTER TABLE public.budget_lignes  ADD COLUMN IF NOT EXISTS devise text NOT NULL DEFAULT 'XOF';
ALTER TABLE public.disbursements  ADD COLUMN IF NOT EXISTS devise text NOT NULL DEFAULT 'XOF';

-- ── Référentiel de taux de change ──────────────────────────────────────────
-- Table de référence globale (les taux de marché ne sont pas propres à une
-- organisation) — lecture ouverte à tout utilisateur authentifié, écriture
-- réservée aux rôles financiers.
CREATE TABLE IF NOT EXISTS public.taux_change (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  devise_source text NOT NULL,
  devise_cible  text NOT NULL,
  taux numeric NOT NULL CHECK (taux > 0),
  date_effet date NOT NULL DEFAULT current_date,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid
);

CREATE INDEX IF NOT EXISTS idx_taux_change_lookup ON public.taux_change (devise_source, devise_cible, date_effet DESC);

ALTER TABLE public.taux_change ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS taux_change_select ON public.taux_change;
CREATE POLICY taux_change_select ON public.taux_change
  FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS taux_change_insert ON public.taux_change;
CREATE POLICY taux_change_insert ON public.taux_change
  FOR INSERT WITH CHECK (current_user_role() IN ('FINANCIER', 'ADMIN', 'SUPER_ADMIN'));

-- ── Résolution de la devise par défaut d'une organisation via un projet ───
CREATE OR REPLACE FUNCTION public.project_devise_defaut(p_project_id uuid)
RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT o.devise_defaut
  FROM public.organisations o
  WHERE o.id = project_organisation_id(p_project_id);
$$;

-- ── Conversion tolérante : si aucun taux connu, retourne le montant tel quel
-- (dégradation gracieuse — pas d'échec bloquant pour une donnée de change
-- manquante ; à corriger en alimentant taux_change, pas en bloquant la saisie).
CREATE OR REPLACE FUNCTION public.convert_montant(p_montant numeric, p_devise_source text, p_devise_cible text)
RETURNS numeric
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_taux numeric;
BEGIN
  IF p_montant IS NULL THEN
    RETURN 0;
  END IF;
  IF p_devise_source IS NULL OR p_devise_cible IS NULL OR p_devise_source = p_devise_cible THEN
    RETURN p_montant;
  END IF;

  SELECT taux INTO v_taux
  FROM public.taux_change
  WHERE devise_source = p_devise_source AND devise_cible = p_devise_cible
    AND date_effet <= current_date
  ORDER BY date_effet DESC
  LIMIT 1;

  IF v_taux IS NULL THEN
    RETURN p_montant;
  END IF;

  RETURN p_montant * v_taux;
END;
$$;

-- ── Recalcul de la ligne budgétaire depuis les vraies transactions ────────
-- Engagé  = somme des contrats liés non résiliés (ACTIF/SUSPENDU/CLOTURE
--           comptent comme capital engagé ; RESILIE est exclu).
-- Payé    = somme des décaissements au statut DECAISSE uniquement.
-- Écrase toute saisie manuelle précédente de montant_engage/montant_paye —
-- comportement assumé : les vraies transactions font foi une fois liées.
CREATE OR REPLACE FUNCTION public.recalc_budget_ligne_montants(p_budget_ligne_id uuid)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_devise_ligne text;
  v_montant_engage numeric;
  v_montant_paye numeric;
BEGIN
  SELECT devise INTO v_devise_ligne FROM public.budget_lignes WHERE id = p_budget_ligne_id;
  IF v_devise_ligne IS NULL THEN
    RETURN;
  END IF;

  SELECT COALESCE(SUM(convert_montant(c.montant, c.devise, v_devise_ligne)), 0)
  INTO v_montant_engage
  FROM public.contracts c
  WHERE c.budget_ligne_id = p_budget_ligne_id
    AND c.deleted_at IS NULL
    AND c.statut <> 'RESILIE';

  SELECT COALESCE(SUM(convert_montant(d.montant, d.devise, v_devise_ligne)), 0)
  INTO v_montant_paye
  FROM public.disbursements d
  WHERE d.budget_ligne_id = p_budget_ligne_id
    AND d.deleted_at IS NULL
    AND d.statut = 'DECAISSE';

  UPDATE public.budget_lignes
  SET montant_engage = v_montant_engage,
      montant_paye   = v_montant_paye,
      updated_at     = now()
  WHERE id = p_budget_ligne_id;
END;
$$;
