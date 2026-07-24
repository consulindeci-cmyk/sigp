// Matrice 3×3 stricte : Probabilité (1-3) × Impact (1-3) → score 1-9, 3
// paliers de criticité (FAIBLE/MOYEN/ELEVE). Remplace l'ancien modèle 4×4
// (FAIBLE/POSSIBLE/PROBABLE/QUASI_CERTAIN × FAIBLE/MODERE/IMPORTANT/CRITIQUE,
// score 1-16, 4 paliers FAIBLE/MODERE/ELEVE/CRITIQUE) qui ne correspondait
// jamais exactement à ce qu'affichait le frontend (déjà compressé sur 1-3
// pour l'aperçu temps réel) — source d'incohérence entre le niveau prévisualisé
// à la saisie et le niveau réellement stocké.
//
// `probabilite`/`impact` sont des colonnes texte libres (aucune contrainte
// CHECK) : on accepte ici soit les nouvelles valeurs numériques '1'/'2'/'3',
// soit les anciennes valeurs textuelles (pour les risques déjà enregistrés
// avant cette unification, jamais migrés en base) — mappées sur l'échelle 1-3
// la plus proche pour ne jamais planter sur une donnée historique.

const LEGACY_PROB_SCORE: Record<string, number> = {
  FAIBLE: 1, POSSIBLE: 1, PROBABLE: 2, QUASI_CERTAIN: 3,
};

const LEGACY_IMPACT_SCORE: Record<string, number> = {
  FAIBLE: 1, MODERE: 2, IMPORTANT: 2, CRITIQUE: 3,
};

function toScore(value: string, legacyMap: Record<string, number>): number {
  const n = Number(value);
  if (n === 1 || n === 2 || n === 3) return n;
  return legacyMap[value] ?? 1;
}

export function computeNiveauCriticite(probabilite: string, impact: string): string {
  const p = toScore(probabilite, LEGACY_PROB_SCORE);
  const i = toScore(impact, LEGACY_IMPACT_SCORE);
  const score = p * i;
  if (score <= 4) return 'FAIBLE';
  if (score <= 6) return 'MOYEN';
  return 'ELEVE';
}
