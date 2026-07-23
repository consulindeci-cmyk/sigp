-- ═══════════════════════════════════════════════════════════════════════════
-- Budget — valorisation WBS (Code WBS, Libellé, Unité, Quantité, Coût
-- Unitaire) + rattachement réel à une source de financement (bailleur)
-- ═══════════════════════════════════════════════════════════════════════════
-- Constat (audit Budget) : le formulaire de ligne budgétaire construisait déjà
-- un sélecteur "Bailleur" sur les vraies funding_sources du projet, mais
-- BudgetPage.tsx ne transmettait jamais ce choix à une colonne réelle —
-- conservé uniquement dans un overlay client ('decorations'), perdu au
-- rechargement. Même constat pour "Compte PCG"/"Pré-engagé"/"Liquidé" :
-- aucune colonne, aucune Edge Function ne les persiste.
--
-- Cette migration ajoute les seules colonnes qui correspondent à un besoin
-- métier réel et durable (modèle Excel de valorisation WBS) : le rattachement
-- à un nœud WBS (composante ou sous-élément) et à une source de financement
-- réelle, plus la ventilation quantité/coût unitaire du montant prévu.
-- compte_comptable_id/montant_pre_engage/montant_liquide ne sont PAS ajoutés
-- ici : aucune demande fonctionnelle réelle derrière, retirés de l'UI en
-- même temps que cette migration plutôt que reconduits sans contenu.

ALTER TABLE public.budget_lignes
  ADD COLUMN IF NOT EXISTS wbs_id uuid REFERENCES public.wbs_nodes(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS unite text,
  ADD COLUMN IF NOT EXISTS quantite numeric,
  ADD COLUMN IF NOT EXISTS cout_unitaire numeric,
  ADD COLUMN IF NOT EXISTS funding_source_id uuid REFERENCES public.funding_sources(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_budget_lignes_wbs_id ON public.budget_lignes (wbs_id);
CREATE INDEX IF NOT EXISTS idx_budget_lignes_funding_source_id ON public.budget_lignes (funding_source_id);
