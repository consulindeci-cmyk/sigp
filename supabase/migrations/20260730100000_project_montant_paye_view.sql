-- ═══════════════════════════════════════════════════════════════════════════
-- Source unique du "montant payé" par projet — évite un 3e endroit qui
-- réplique la même formule au risque de diverger.
-- ═══════════════════════════════════════════════════════════════════════════
-- Constat : project-detail-summary (fiche projet) et dashboard-summary
-- (portefeuille) sommaient déjà budget_lignes.montant_paye + les décaissements
-- DECAISSE rattachés seulement à un Contrat/une Source de financement (sans
-- budget_ligne_id), chacun dans sa propre logique JS dupliquée. useProjects.ts
-- (fetchBatchAggregations, liste des projets / ProjectCard.tsx) ne faisait que
-- la première moitié (budget_lignes seul) → taux de décaissement différent
-- entre les cartes de la liste et la fiche projet pour un même projet.
--
-- Cette vue centralise le calcul en base : les 3 endroits peuvent maintenant
-- lire la même valeur au lieu de la recalculer chacun à sa façon. Les Edge
-- Functions ne sont volontairement PAS migrées vers cette vue dans cette
-- migration (hors périmètre demandé) — seul useProjects.ts en dépend pour
-- l'instant, mais la vue est écrite pour pouvoir remplacer les deux calculs
-- dupliqués plus tard sans changer sa définition.
--
-- security_invoker = true (PG15+) : la vue s'exécute avec les droits ET les
-- policies RLS de l'appelant, pas du propriétaire de la vue — indispensable
-- ici puisque useProjects.ts l'interroge via le client Supabase du navigateur
-- (JWT utilisateur), pas via service_role. Sans ça, la vue risquerait de
-- bypasser le cloisonnement multi-tenant (RLS) sur projects/disbursements/etc.
-- ═══════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE VIEW public.project_montant_paye_view
WITH (security_invoker = true) AS
WITH lignes AS (
  SELECT bv.project_id, SUM(bl.montant_paye) AS montant
  FROM public.budget_lignes bl
  JOIN public.budget_versions bv ON bv.id = bl.version_id AND bv.deleted_at IS NULL
  WHERE bl.deleted_at IS NULL
  GROUP BY bv.project_id
),
hors_ligne AS (
  -- Un décaissement DECAISSE sans budget_ligne_id est rattaché au projet via
  -- budget_version_id, contract_id ou funding_source_id (au moins un des 3,
  -- cf. validateRelations de disbursements-create) — COALESCE prend le
  -- premier chemin résolu, une seule ligne ne peut donc jamais être comptée
  -- deux fois même si plusieurs rattachements sont renseignés à la fois.
  SELECT resolved.project_id, SUM(d.montant) AS montant
  FROM public.disbursements d
  CROSS JOIN LATERAL (
    SELECT COALESCE(
      (SELECT bv.project_id FROM public.budget_versions bv WHERE bv.id = d.budget_version_id AND bv.deleted_at IS NULL),
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
