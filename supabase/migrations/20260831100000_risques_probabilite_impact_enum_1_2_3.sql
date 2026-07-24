-- Les colonnes risques.probabilite/impact sont de vrais ENUM Postgres
-- (RiskProbability: FAIBLE/POSSIBLE/PROBABLE/QUASI_CERTAIN ; RiskImpact:
-- FAIBLE/MODERE/IMPORTANT/CRITIQUE), pas du texte libre — hypothèse erronée
-- faite lors de l'unification du scoring 3×3 (_shared/risk-scoring.ts,
-- useRisks.ts), qui envoie désormais '1'/'2'/'3'. Un ENUM Postgres refuse
-- toute valeur non déclarée : risques-create échouait systématiquement
-- (500 "invalid input value for enum RiskImpact: 1").
--
-- On ajoute ici '1'/'2'/'3' comme valeurs supplémentaires des deux ENUM,
-- sans toucher aux anciennes — les risques déjà enregistrés avant cette
-- unification gardent leur valeur legacy, toujours lue correctement via le
-- repli LEGACY_PROB_SCORE/LEGACY_IMPACT_SCORE (_shared/risk-scoring.ts,
-- hooks/useRisks.ts).

ALTER TYPE "RiskProbability" ADD VALUE IF NOT EXISTS '1';
ALTER TYPE "RiskProbability" ADD VALUE IF NOT EXISTS '2';
ALTER TYPE "RiskProbability" ADD VALUE IF NOT EXISTS '3';

ALTER TYPE "RiskImpact" ADD VALUE IF NOT EXISTS '1';
ALTER TYPE "RiskImpact" ADD VALUE IF NOT EXISTS '2';
ALTER TYPE "RiskImpact" ADD VALUE IF NOT EXISTS '3';
