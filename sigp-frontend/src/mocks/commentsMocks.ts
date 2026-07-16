import type {
  ModuleCommentaire, StatutCommentaire,
  PrioriteCommentaire, TypeCommentaire,
} from '@/types';

// ─── Constants (options d'énumération pour les formulaires/filtres — pas des
// données métier, pas de mock à retirer) ──────────────────────────────────────

export const MODULES_COMMENTAIRE: ModuleCommentaire[] = [
  'Projet', 'PTBA', 'Activité', 'Budget', 'Source de financement',
  'Contrat', 'Décaissement', 'Risque', 'Livrable', 'Document', 'Rapport',
];

export const STATUT_COMMENTAIRE_LABEL: Record<StatutCommentaire, string> = {
  OUVERT:     'Ouvert',
  EN_COURS:   'En cours',
  RESOLU:     'Résolu',
  FERME:      'Fermé',
  EN_ATTENTE: 'En attente',
};

export const PRIORITE_COMMENTAIRE_LABEL: Record<PrioriteCommentaire, string> = {
  FAIBLE:  'Faible',
  NORMALE: 'Normale',
  HAUTE:   'Haute',
  URGENTE: 'Urgente',
};

export const TYPE_COMMENTAIRE_LABEL: Record<TypeCommentaire, string> = {
  QUESTION:    'Question',
  OBSERVATION: 'Observation',
  SUGGESTION:  'Suggestion',
  ALERTE:      'Alerte',
  DECISION:    'Décision',
  ACTION:      'Action',
  INFORMATION: 'Information',
};

export const STATUT_OPTIONS = (
  Object.entries(STATUT_COMMENTAIRE_LABEL) as [StatutCommentaire, string][]
).map(([value, label]) => ({ value, label }));

export const PRIORITE_OPTIONS = (
  Object.entries(PRIORITE_COMMENTAIRE_LABEL) as [PrioriteCommentaire, string][]
).map(([value, label]) => ({ value, label }));

export const TYPE_OPTIONS = (
  Object.entries(TYPE_COMMENTAIRE_LABEL) as [TypeCommentaire, string][]
).map(([value, label]) => ({ value, label }));

export const MODULE_OPTIONS = MODULES_COMMENTAIRE.map(m => ({ value: m, label: m }));
