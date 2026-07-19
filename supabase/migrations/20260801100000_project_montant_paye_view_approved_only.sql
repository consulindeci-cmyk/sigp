-- ═══════════════════════════════════════════════════════════════════════════
-- Alignement final des versions budgétaires — suite immédiate du blindage EVM
-- ═══════════════════════════════════════════════════════════════════════════
-- calculate_project_evm() (20260731100000) et project-detail-summary /
-- dashboard-summary (même migration applicative côté Edge Functions) ne
-- sommaient déjà plus que la version budgétaire APPROUVE. project_montant_
-- paye_view (cartes de la liste des projets, via useProjects.ts) sommait
-- encore toutes les versions non supprimées — laissée de côté volontairement
-- lors de sa création pour rester strictement dans le périmètre demandé à
-- l'époque, signalée explicitement, et corrigée maintenant sur demande
-- explicite. Toutes les surfaces financières (EVM, en-tête, cartes,
-- Dashboard) appliquent désormais la même règle : seule la version APPROUVE
-- fait foi.
-- ═══════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE VIEW public.project_montant_paye_view
WITH (security_invoker = true) AS
WITH lignes AS (
  SELECT bv.project_id, SUM(bl.montant_paye) AS montant
  FROM public.budget_lignes bl
  JOIN public.budget_versions bv ON bv.id = bl.version_id AND bv.deleted_at IS NULL
  WHERE bl.deleted_at IS NULL
    AND bv.statut = 'APPROUVE'
  GROUP BY bv.project_id
),
hors_ligne AS (
  -- Un décaissement DECAISSE sans budget_ligne_id est rattaché au projet via
  -- budget_version_id, contract_id ou funding_source_id (au moins un des 3,
  -- cf. validateRelations de disbursements-create) — COALESCE prend le
  -- premier chemin résolu, une seule ligne ne peut donc jamais être comptée
  -- deux fois même si plusieurs rattachements sont renseignés à la fois.
  -- Le chemin budget_version_id est lui aussi restreint à APPROUVE, par
  -- cohérence avec la part "lignes" ci-dessus.
  SELECT resolved.project_id, SUM(d.montant) AS montant
  FROM public.disbursements d
  CROSS JOIN LATERAL (
    SELECT COALESCE(
      (SELECT bv.project_id FROM public.budget_versions bv WHERE bv.id = d.budget_version_id AND bv.deleted_at IS NULL AND bv.statut = 'APPROUVE'),
      (SELECT c.project_id FROM public.contracts c WHERE c.id = d.contract_id AND c.deleted_at IS NULL),
      (SELECT fs.project_id FROM public.funding_sources fs WHERE fs.id = d.funding_source_id AND fs.deleted_at IS NULL)
    ) AS project_id
  ) resolved
  WHERE d.statut = 'DECAISSE'
    AND d.budget_ligne_id IS NULL
    AND d.deleted_at IS NULL
    AND resolved.project_id IS NOT NULL
  GROUP BY resolved.project_id
)
SELECT
  p.id AS project_id,
  COALESCE(l.montant, 0) + COALESCE(h.montant, 0) AS montant_paye
FROM public.projects p
LEFT JOIN lignes l ON l.project_id = p.id
LEFT JOIN hors_ligne h ON h.project_id = p.id
WHERE p.deleted_at IS NULL;

NOTIFY pgrst, 'reload schema';
