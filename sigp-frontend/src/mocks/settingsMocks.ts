// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

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

export type Apparence = 'light' | 'dark' | 'system';
export type DensiteAffichage = 'compact' | 'normal' | 'confortable';
export type FormatDate = 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD';
export type FormatNombre = 'FR' | 'EN';

export interface UserPreferences {
  langue: string;
  fuseauHoraire: string;
  apparence: Apparence;
  densiteAffichage: DensiteAffichage;
  formatDate: FormatDate;
  devise: string;
  premierJourSemaine: 'Lundi' | 'Dimanche';
  formatNombre: FormatNombre;
}

export interface EmailNotifications {
  nouvellesMissions: boolean;
  validation: boolean;
  alerteBudget: boolean;
  rapportPlanifie: boolean;
  mentions: boolean;
  resumeHebdo: boolean;
}

export interface AppNotifications {
  nouvellesMissions: boolean;
  validation: boolean;
  alerteBudget: boolean;
  mentions: boolean;
  rappelEcheance: boolean;
}

export interface NotificationPreferences {
  email: EmailNotifications;
  app: AppNotifications;
  frequenceResume: 'Quotidien' | 'Hebdomadaire' | 'Mensuel';
}

export type SessionDevice = 'desktop' | 'mobile' | 'tablet';

export interface ActiveSession {
  id: string;
  appareil: string;
  device: SessionDevice;
  navigateur: string;
  ip: string;
  localisation: string;
  dernierAcces: string;
  courante: boolean;
}

export interface ConnectionHistory {
  id: string;
  date: string;
  ip: string;
  localisation: string;
  navigateur: string;
  statut: 'Succès' | 'Échec';
}

export interface ChangeHistory {
  id: string;
  champ: string;
  ancienneValeur: string;
  nouvelleValeur: string;
  date: string;
}

export interface SettingsKPIsData {
  profilScore: number;
  sessionsActives: number;
  notificationsActives: number;
  derniereConnexion: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Reference options
// ─────────────────────────────────────────────────────────────────────────────

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

// ─────────────────────────────────────────────────────────────────────────────
// Mock data
// ─────────────────────────────────────────────────────────────────────────────

export const mockUserProfile: UserProfile = {
  id: 'usr-001',
  prenom: 'Amadou',
  nom: 'Diallo',
  initiales: 'AD',
  email: 'a.diallo@gpd-erp.org',
  telephone: '+221 77 456 78 90',
  poste: 'Directeur de Programme',
  organisation: 'SIGP — Système Intégré de Gestion de Projets',
  bio: "Expert en gestion de projets de développement international. Spécialisé dans la coordination multi-bailleurs et le suivi-évaluation des programmes financés par la coopération bilatérale et multilatérale.",
  role: 'ADMIN_PROJET',
  roleLabel: 'Administrateur Projet',
  actif: true,
  dateInscription: '15 mars 2024',
  dernierAcces: '28 juin 2026 09:45',
  projetsAffecter: [
    'Électrification Solaire Zones Rurales',
    'Accès Eau Potable et Assainissement Rural',
    'Santé Maternelle et Infantile',
    'Gouvernance Locale et Décentralisation',
  ],
};

export const mockUserPreferences: UserPreferences = {
  langue: 'fr',
  fuseauHoraire: 'Africa/Dakar',
  apparence: 'system',
  densiteAffichage: 'normal',
  formatDate: 'DD/MM/YYYY',
  devise: 'XOF',
  premierJourSemaine: 'Lundi',
  formatNombre: 'FR',
};

export const mockNotificationPreferences: NotificationPreferences = {
  email: {
    nouvellesMissions: true,
    validation: true,
    alerteBudget: true,
    rapportPlanifie: true,
    mentions: true,
    resumeHebdo: false,
  },
  app: {
    nouvellesMissions: true,
    validation: true,
    alerteBudget: false,
    mentions: true,
    rappelEcheance: true,
  },
  frequenceResume: 'Hebdomadaire',
};

export const mockActiveSessions: ActiveSession[] = [
  {
    id: 'sess-001',
    appareil: 'MacBook Pro 16"',
    device: 'desktop',
    navigateur: 'Chrome 125',
    ip: '41.82.15.23',
    localisation: 'Dakar, Sénégal',
    dernierAcces: 'En cours',
    courante: true,
  },
  {
    id: 'sess-002',
    appareil: 'iPhone 15 Pro',
    device: 'mobile',
    navigateur: 'Safari 17',
    ip: '41.82.15.24',
    localisation: 'Dakar, Sénégal',
    dernierAcces: 'Il y a 2h',
    courante: false,
  },
  {
    id: 'sess-003',
    appareil: 'Dell XPS 15',
    device: 'desktop',
    navigateur: 'Firefox 128',
    ip: '196.200.54.12',
    localisation: "Abidjan, Côte d'Ivoire",
    dernierAcces: 'Il y a 5h',
    courante: false,
  },
  {
    id: 'sess-004',
    appareil: 'iPad Pro',
    device: 'tablet',
    navigateur: 'Safari 17',
    ip: '154.72.165.85',
    localisation: 'Bamako, Mali',
    dernierAcces: 'Hier 18:32',
    courante: false,
  },
];

export const mockConnectionHistory: ConnectionHistory[] = [
  { id: 'conn-001', date: '28/06/2026 09:45', ip: '41.82.15.23', localisation: 'Dakar, Sénégal', navigateur: 'Chrome 125', statut: 'Succès' },
  { id: 'conn-002', date: '27/06/2026 16:20', ip: '41.82.15.24', localisation: 'Dakar, Sénégal', navigateur: 'Safari 17', statut: 'Succès' },
  { id: 'conn-003', date: '27/06/2026 08:55', ip: '196.200.54.12', localisation: 'Abidjan, CI', navigateur: 'Firefox 128', statut: 'Succès' },
  { id: 'conn-004', date: '26/06/2026 21:10', ip: '154.72.165.85', localisation: 'Bamako, Mali', navigateur: 'Safari 17', statut: 'Succès' },
  { id: 'conn-005', date: '25/06/2026 14:30', ip: '92.104.0.1',   localisation: 'Paris, France', navigateur: 'Chrome 124', statut: 'Échec' },
  { id: 'conn-006', date: '24/06/2026 11:00', ip: '41.82.15.23', localisation: 'Dakar, Sénégal', navigateur: 'Chrome 125', statut: 'Succès' },
];

export const mockChangeHistory: ChangeHistory[] = [
  { id: 'ch-001', champ: 'Email', ancienneValeur: 'amadou.d@gmail.com', nouvelleValeur: 'a.diallo@gpd-erp.org', date: '20/06/2026 10:15' },
  { id: 'ch-002', champ: 'Téléphone', ancienneValeur: '+221 77 123 45 67', nouvelleValeur: '+221 77 456 78 90', date: '15/06/2026 14:30' },
  { id: 'ch-003', champ: 'Mot de passe', ancienneValeur: '••••••••', nouvelleValeur: '••••••••••••', date: '10/06/2026 09:00' },
  { id: 'ch-004', champ: 'Langue', ancienneValeur: 'English', nouvelleValeur: 'Français', date: '05/06/2026 16:45' },
  { id: 'ch-005', champ: 'Fuseau horaire', ancienneValeur: 'UTC', nouvelleValeur: 'Africa/Dakar', date: '01/06/2026 11:20' },
  { id: 'ch-006', champ: 'Apparence', ancienneValeur: 'Sombre', nouvelleValeur: 'Système', date: '28/05/2026 08:30' },
];
