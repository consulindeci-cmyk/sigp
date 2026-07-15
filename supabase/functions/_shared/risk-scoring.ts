// Reproduit exactement RisqueService.computeNiveauCriticite() (NestJS).
type RiskProbability = 'FAIBLE' | 'POSSIBLE' | 'PROBABLE' | 'QUASI_CERTAIN';
type RiskImpact = 'FAIBLE' | 'MODERE' | 'IMPORTANT' | 'CRITIQUE';

const PROB_SCORE: Record<RiskProbability, number> = {
  FAIBLE: 1,
  POSSIBLE: 2,
  PROBABLE: 3,
  QUASI_CERTAIN: 4,
};

const IMPACT_SCORE: Record<RiskImpact, number> = {
  FAIBLE: 1,
  MODERE: 2,
  IMPORTANT: 3,
  CRITIQUE: 4,
};

export function computeNiveauCriticite(probabilite: RiskProbability, impact: RiskImpact): string {
  const score = PROB_SCORE[probabilite] * IMPACT_SCORE[impact];
  if (score <= 2) return 'FAIBLE';
  if (score <= 4) return 'MODERE';
  if (score <= 8) return 'ELEVE';
  return 'CRITIQUE';
}
