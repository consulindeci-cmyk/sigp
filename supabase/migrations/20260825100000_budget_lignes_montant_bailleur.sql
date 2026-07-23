-- ═══════════════════════════════════════════════════════════════════════════
-- Budget — montant de financement bailleur par ligne
-- ═══════════════════════════════════════════════════════════════════════════
-- Constat (correction Matrice Budget) : la colonne "Financement Bailleur"
-- affichait le nom du bailleur (funding_sources.nom via funding_source_id) —
-- mais la valeur réellement utile pour le calcul du Disponible d'une ligne
-- est le MONTANT que ce bailleur finance sur cette ligne précise (utile en
-- cofinancement, où le bailleur ne couvre qu'une partie du Coût Total), pas
-- son nom. funding_source_id reste la colonne de rattachement réel (qui est
-- le bailleur, pour les filtres/exports) ; montant_bailleur est la valeur
-- chiffrée affichée dans la colonne elle-même.
--
-- Nullable : quand non renseigné, le frontend traite la ligne comme
-- intégralement financée par le bailleur choisi (montant_bailleur = Coût
-- Total), cf. BudgetLigneSlideOver — pas de valeur par défaut imposée ici.

ALTER TABLE public.budget_lignes
  ADD COLUMN IF NOT EXISTS montant_bailleur numeric;
