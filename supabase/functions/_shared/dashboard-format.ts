// Helpers de formatage portés fidèlement depuis sigp-backend-v1/src/dashboard/dashboard.service.ts.

const FR_MONTHS_SHORT = ['Jan.', 'Fév.', 'Mar.', 'Avr.', 'Mai', 'Juin', 'Juil.', 'Août', 'Sep.', 'Oct.', 'Nov.', 'Déc.'];
const FR_MONTHS_ABBR = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];

export function fmtMonthLabel(d: Date): string {
  return `${FR_MONTHS_SHORT[d.getMonth()]} ${d.getFullYear()}`;
}

export function fmtMonthAbbr(d: Date): string {
  return FR_MONTHS_ABBR[d.getMonth()];
}

export function monthKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function daysApart(a: Date, b: Date): number {
  return Math.floor((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}

export function relativeTime(past: Date, now: Date): string {
  const hoursAgo = Math.floor((now.getTime() - past.getTime()) / (1000 * 60 * 60));
  if (hoursAgo < 1) return "À l'instant";
  if (hoursAgo < 24) return `Il y a ${hoursAgo}h`;
  const daysAgo = Math.floor(hoursAgo / 24);
  return daysAgo === 1 ? 'Hier' : `Il y a ${daysAgo}j`;
}

export function relativeFuture(daysUntil: number): string {
  if (daysUntil <= 0) return "Aujourd'hui";
  if (daysUntil === 1) return 'Demain';
  return `Dans ${daysUntil} jours`;
}

export function deadlineColorClass(daysUntil: number): string {
  if (daysUntil <= 3) return 'bg-destructive';
  if (daysUntil <= 7) return 'bg-warning';
  if (daysUntil <= 14) return 'bg-primary';
  return 'bg-muted-foreground';
}

export const NOTIF_TYPE_MAP: Record<string, 'alert' | 'validation' | 'payment' | 'milestone'> = {
  RISQUE_CRITIQUE: 'alert',
  BUDGET_DEPASSE: 'alert',
  EVM_ALERTE_CPI: 'alert',
  EVM_ALERTE_SPI: 'alert',
  CONTRAT_EXPIRE: 'alert',
  LIVRABLE_EN_RETARD: 'alert',
  DOCUMENT_VALIDE: 'validation',
  RAPPORT_PRET: 'validation',
  BUDGET_VALIDE: 'validation',
  PAIEMENT_DU: 'payment',
  CONTRAT_SIGNE: 'payment',
};

export const NOTIF_COLOR: Record<string, string> = {
  RISQUE_CRITIQUE: 'bg-destructive',
  BUDGET_DEPASSE: 'bg-destructive',
  EVM_ALERTE_CPI: 'bg-destructive',
  LIVRABLE_EN_RETARD: 'bg-warning',
  CONTRAT_EXPIRE: 'bg-warning',
  DOCUMENT_VALIDE: 'bg-success',
  RAPPORT_PRET: 'bg-success',
  BUDGET_VALIDE: 'bg-success',
};

// Modèle 3×3 (FAIBLE/MOYEN/ELEVE) — CRITIQUE/MODERE restent mappés au même
// rang que ELEVE/MOYEN pour les risques déjà enregistrés avant l'unification
// du scoring (jamais migrés en base, cf. _shared/risk-scoring.ts).
export const CRITICITE_ORDER: Record<string, number> = { CRITIQUE: 0, ELEVE: 0, MOYEN: 1, MODERE: 1, FAIBLE: 2 };

export function probToPct(p: string): number {
  const n = Number(p);
  if (n === 1) return 33;
  if (n === 2) return 66;
  if (n === 3) return 95;
  const legacy: Record<string, number> = { FAIBLE: 25, POSSIBLE: 50, PROBABLE: 75, QUASI_CERTAIN: 95 };
  return legacy[p] ?? 50;
}

export function niveauToLevel(n: string): 'high' | 'medium' | 'low' {
  return n === 'ELEVE' || n === 'CRITIQUE' ? 'high' : n === 'MOYEN' || n === 'MODERE' ? 'medium' : 'low';
}

// Doit rester un sous-ensemble exact de ProgressBarColor (frontend) — une
// valeur hors de cette union (ex: 'muted-foreground') rend la barre de
// progression correspondante invisible côté UI (cast `as any` qui masque
// l'erreur de type au moment de la consommation).
export const DISTRIBUTION_COLORS = ['primary', 'success', 'warning', 'destructive'];
