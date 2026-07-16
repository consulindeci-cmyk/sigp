import type { CategorieParametre, StatutParametre } from '@/types';

// ─── Labels ────────────────────────────────────────────────────────────────────

export const STATUT_PARAM_LABEL: Record<StatutParametre, string> = {
  ACTIF:      'Actif',
  INACTIF:    'Inactif',
  EN_ATTENTE: 'En attente',
  OBSOLETE:   'Obsolète',
};

export const CATEGORIE_PARAM_LABEL: Record<CategorieParametre, string> = {
  'Général':       'Général',
  'Organisation':  'Organisation',
  'Notifications': 'Notifications',
  'Validation':    'Validation',
  'Sécurité':      'Sécurité',
  'Affichage':     'Affichage',
  'Archivage':     'Archivage',
};

// ─── Options ──────────────────────────────────────────────────────────────────

export const CATEGORIE_PARAM_OPTIONS: { label: string; value: CategorieParametre }[] = [
  { label: 'Général',       value: 'Général' },
  { label: 'Organisation',  value: 'Organisation' },
  { label: 'Notifications', value: 'Notifications' },
  { label: 'Validation',    value: 'Validation' },
  { label: 'Sécurité',      value: 'Sécurité' },
  { label: 'Affichage',     value: 'Affichage' },
  { label: 'Archivage',     value: 'Archivage' },
];

export const STATUT_PARAM_OPTIONS: { label: string; value: StatutParametre }[] = [
  { label: 'Actif',      value: 'ACTIF' },
  { label: 'Inactif',    value: 'INACTIF' },
  { label: 'En attente', value: 'EN_ATTENTE' },
  { label: 'Obsolète',   value: 'OBSOLETE' },
];

export const TYPE_VALEUR_OPTIONS = [
  { label: 'Texte',    value: 'TEXTE'   },
  { label: 'Nombre',   value: 'NOMBRE'  },
  { label: 'Booléen',  value: 'BOOLEEN' },
  { label: 'Date',     value: 'DATE'    },
  { label: 'Liste',    value: 'LISTE'   },
  { label: 'JSON',     value: 'JSON'    },
] as const;

// ─── (Anciennement : liste mock d'auteurs et générateur de 50 paramètres
// factices, supprimés — la table project_settings réelle remplace tout ça,
// cf. useProjectSettings.ts) ────────────────────────────────────────────────

// ─── Legacy exports (used by src/pages/SettingsPage.tsx and settings sections) ─

export interface UserProfile {
  id: string;
  prenom: string;
  nom: string;
  initiales: string;
  email: string;
  telephone: string;
  poste: string;
  organisation: string;
  bio: string;
  role: string;
  roleLabel: string;
  actif: boolean;
  dateInscription: string;
  dernierAcces: string;
  projetsAffecter: string[];
}

export type FormatDate = 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD';

export const TIMEZONES: { label: string; value: string }[] = [
  { label: 'UTC+00:00 — Africa/Dakar', value: 'Africa/Dakar' },
  { label: 'UTC+00:00 — Africa/Abidjan', value: 'Africa/Abidjan' },
  { label: 'UTC+01:00 — Africa/Lagos', value: 'Africa/Lagos' },
  { label: 'UTC+01:00 — Africa/Ndjamena', value: 'Africa/Ndjamena' },
  { label: 'UTC+01:00 — Africa/Douala', value: 'Africa/Douala' },
  { label: 'UTC+01:00 — Europe/Paris', value: 'Europe/Paris' },
  { label: 'UTC+02:00 — Africa/Cairo', value: 'Africa/Cairo' },
  { label: 'UTC+03:00 — Africa/Nairobi', value: 'Africa/Nairobi' },
  { label: 'UTC+00:00 — UTC', value: 'UTC' },
  { label: 'UTC-05:00 — America/New_York', value: 'America/New_York' },
];

export const LANGUES: { label: string; value: string }[] = [
  { label: 'Français', value: 'fr' },
  { label: 'English', value: 'en' },
  { label: 'Español', value: 'es' },
  { label: 'Português', value: 'pt' },
  { label: 'العربية', value: 'ar' },
];

export const DEVISES: { label: string; value: string }[] = [
  { label: 'XOF — Franc CFA (BCEAO)', value: 'XOF' },
  { label: 'XAF — Franc CFA (BEAC)', value: 'XAF' },
  { label: 'EUR — Euro', value: 'EUR' },
  { label: 'USD — Dollar américain', value: 'USD' },
  { label: 'GBP — Livre sterling', value: 'GBP' },
  { label: 'CHF — Franc suisse', value: 'CHF' },
];

export const FORMATS_DATE: { label: string; value: FormatDate }[] = [
  { label: 'JJ/MM/AAAA (28/06/2026)', value: 'DD/MM/YYYY' },
  { label: 'MM/JJ/AAAA (06/28/2026)', value: 'MM/DD/YYYY' },
  { label: 'AAAA-MM-JJ (2026-06-28)', value: 'YYYY-MM-DD' },
];

