import type { CategorieParametre, StatutParametre, ConfigurationProjet } from '@/types';

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

export const AUTEURS_PARAM = [
  'Amadou Diallo',
  'Fatima Koné',
  'Ibrahim Sanogo',
  'Marie Coulibaly',
  'Souleymane Touré',
];

// ─── Mock factory ─────────────────────────────────────────────────────────────

let _seq = 0;
function p(
  code: string,
  categorie: CategorieParametre,
  nom: string,
  valeur: string,
  valeur_defaut: string,
  type_valeur: ConfigurationProjet['type_valeur'],
  description: string,
  requis: boolean,
  modifiable: boolean,
  statut: StatutParametre,
  date_modification: string,
  modifie_par: string,
): ConfigurationProjet {
  _seq++;
  return {
    id:                `prm-${String(_seq).padStart(3, '0')}`,
    projet_id:         'mock-proj-01',
    code_param:        code,
    categorie,
    nom,
    valeur,
    valeur_defaut,
    type_valeur,
    description,
    requis,
    modifiable,
    statut,
    date_modification,
    modifie_par,
    createdAt: `${date_modification}T08:00:00.000Z`,
    updatedAt: `${date_modification}T08:00:00.000Z`,
  };
}

// ─── Données mock — 50 paramètres ─────────────────────────────────────────────

export const MOCK_CONFIGURATIONS: ConfigurationProjet[] = [

  // ── Général (9) ─────────────────────────────────────────────────────────────
  p('GEN-001', 'Général', 'Nom du projet',           'Électrification Solaire Zones Rurales',     'Nouveau Projet',        'TEXTE',   'Nom complet officiel du projet.',                                         true,  true,  'ACTIF',      '2026-01-10', 'Amadou Diallo'),
  p('GEN-002', 'Général', 'Code projet',             'PDES-BM-2024',                              'PROJ-001',              'TEXTE',   'Identifiant unique du projet pour le système.',                           true,  false, 'ACTIF',      '2026-01-10', 'Amadou Diallo'),
  p('GEN-003', 'Général', 'Description',             'Projet de déploiement solaire financé par la Banque Mondiale dans les zones rurales du Sénégal, couvrant 120 villages.', '', 'TEXTE', 'Description courte du projet pour les rapports.', false, true,  'ACTIF',      '2026-01-15', 'Amadou Diallo'),
  p('GEN-004', 'Général', 'Date de démarrage',       '2024-01-15',                                '2024-01-01',            'DATE',    'Date officielle de démarrage du projet.',                                  true,  false, 'ACTIF',      '2026-01-10', 'Ibrahim Sanogo'),
  p('GEN-005', 'Général', 'Date de clôture prévue',  '2028-12-31',                                '2027-12-31',            'DATE',    'Date de clôture prévisionnelle selon la convention.',                     true,  true,  'ACTIF',      '2026-02-05', 'Amadou Diallo'),
  p('GEN-006', 'Général', 'Devise principale',       'XOF',                                       'XOF',                   'LISTE',   'Devise utilisée pour tous les montants budgétaires.',                     true,  true,  'ACTIF',      '2026-01-10', 'Fatima Koné'),
  p('GEN-007', 'Général', 'Fuseau horaire',          'Africa/Dakar',                              'UTC',                   'LISTE',   'Fuseau horaire de référence pour les dates et heures.',                   true,  true,  'ACTIF',      '2026-01-12', 'Amadou Diallo'),
  p('GEN-008', 'Général', 'Langue principale',       'fr',                                        'fr',                    'LISTE',   'Langue de communication officielle du projet.',                           true,  true,  'ACTIF',      '2026-01-12', 'Amadou Diallo'),
  p('GEN-009', 'Général', 'Bailleur principal',      'Banque Mondiale',                           'Non défini',            'TEXTE',   'Nom du bailleur de fonds principal du projet.',                           true,  true,  'ACTIF',      '2026-01-10', 'Amadou Diallo'),

  // ── Organisation (8) ────────────────────────────────────────────────────────
  p('ORG-001', 'Organisation', 'Unité de gestion',              'Unité de Gestion de Projet (UGP)',      'UGP',         'TEXTE',  "Entité administrative responsable de l'exécution du projet.",            true,  true,  'ACTIF',      '2026-01-20', 'Amadou Diallo'),
  p('ORG-002', 'Organisation', 'Chef de projet',                'Amadou Diallo',                         'Non désigné', 'TEXTE',  'Responsable principal de la coordination du projet.',                    true,  true,  'ACTIF',      '2026-01-20', 'Ibrahim Sanogo'),
  p('ORG-003', 'Organisation', 'Coordonnateur technique',       'Ibrahim Sanogo',                        'Non désigné', 'TEXTE',  'Responsable de la supervision des composantes techniques.',              true,  true,  'ACTIF',      '2026-01-20', 'Amadou Diallo'),
  p('ORG-004', 'Organisation', 'Responsable financier',         'Fatima Koné',                           'Non désigné', 'TEXTE',  'Responsable de la gestion financière et comptable du projet.',           true,  true,  'ACTIF',      '2026-01-20', 'Amadou Diallo'),
  p('ORG-005', 'Organisation', 'Responsable passation marchés', 'Souleymane Touré',                      'Non désigné', 'TEXTE',  'Responsable de la passation des marchés et contrats.',                   true,  true,  'ACTIF',      '2026-01-20', 'Amadou Diallo'),
  p('ORG-006', 'Organisation', 'Responsable suivi-évaluation',  'Marie Coulibaly',                       'Non désigné', 'TEXTE',  "Responsable du suivi des indicateurs et de l'évaluation du projet.",     true,  true,  'ACTIF',      '2026-01-20', 'Amadou Diallo'),
  p('ORG-007', 'Organisation', 'Ministère de tutelle',          "Ministère de l'Énergie et des Mines",   'Non défini',  'TEXTE',  'Ministère technique assurant la tutelle institutionnelle du projet.',    true,  true,  'ACTIF',      '2026-01-15', 'Ibrahim Sanogo'),
  p('ORG-008', 'Organisation', 'Siège du projet',               'Dakar, Sénégal',                        'Non défini',  'TEXTE',  "Localisation géographique du bureau principal de l'UGP.",                true,  true,  'ACTIF',      '2026-01-15', 'Amadou Diallo'),

  // ── Notifications (7) ───────────────────────────────────────────────────────
  p('NOT-001', 'Notifications', 'Alertes email actives',          'true',    'true',    'BOOLEEN', "Activer l'envoi des alertes système par email.",                          true,  true,  'ACTIF',   '2026-02-10', 'Fatima Koné'),
  p('NOT-002', 'Notifications', 'Rappels par email',              'true',    'true',    'BOOLEEN', "Envoyer des rappels d'échéance par email.",                               false, true,  'ACTIF',   '2026-02-10', 'Fatima Koné'),
  p('NOT-003', 'Notifications', 'Fréquence des rapports auto',    'mensuel', 'mensuel', 'LISTE',   'Fréquence de génération automatique des rapports de synthèse.',           false, true,  'ACTIF',   '2026-02-15', 'Marie Coulibaly'),
  p('NOT-004', 'Notifications', 'Seuil alerte budget (%)',        '80',      '80',      'NOMBRE',  'Pourcentage de consommation budgétaire déclenchant une alerte.',          true,  true,  'ACTIF',   '2026-02-10', 'Fatima Koné'),
  p('NOT-005', 'Notifications', 'Rappel avant échéance (jours)',  '7',       '7',       'NOMBRE',  "Nombre de jours avant échéance pour l'envoi du rappel.",                  false, true,  'ACTIF',   '2026-02-20', 'Fatima Koné'),
  p('NOT-006', 'Notifications', 'Email notifications validation', 'true',    'true',    'BOOLEEN', 'Notifier par email lors des étapes de validation.',                       false, true,  'ACTIF',   '2026-02-10', 'Ibrahim Sanogo'),
  p('NOT-007', 'Notifications', 'Copie direction',                'false',   'false',   'BOOLEEN', 'Envoyer une copie de toutes les notifications à la direction.',            false, true,  'INACTIF', '2026-03-01', 'Amadou Diallo'),

  // ── Validation (7) ──────────────────────────────────────────────────────────
  p('VAL-001', 'Validation', 'Niveaux de validation',           '3',          '2',     'NOMBRE',  'Nombre de niveaux hiérarchiques de validation requis.',                   true,  true,  'ACTIF',      '2026-02-25', 'Amadou Diallo'),
  p('VAL-002', 'Validation', 'Workflow automatique',            'true',       'true',  'BOOLEEN', 'Passage automatique au niveau suivant après validation.',                  false, true,  'ACTIF',      '2026-02-25', 'Amadou Diallo'),
  p('VAL-003', 'Validation', 'Validation requise (budget)',     'true',       'true',  'BOOLEEN', 'Exiger une validation hiérarchique pour toute modification budgétaire.',   true,  true,  'ACTIF',      '2026-02-25', 'Fatima Koné'),
  p('VAL-004', 'Validation', 'Seuil validation contrats (FCFA)', '5000000',  '1000000', 'NOMBRE', 'Montant à partir duquel la validation de contrat est obligatoire.',       true,  true,  'ACTIF',      '2026-03-05', 'Souleymane Touré'),
  p('VAL-005', 'Validation', 'Délai max de validation (jours)', '5',          '3',     'NOMBRE',  'Délai maximum accordé à chaque validateur avant escalade.',                false, true,  'ACTIF',      '2026-03-05', 'Amadou Diallo'),
  p('VAL-006', 'Validation', 'Commentaire rejet obligatoire',   'true',       'true',  'BOOLEEN', "Exiger un commentaire explicatif lors d'un rejet de validation.",          true,  true,  'ACTIF',      '2026-02-25', 'Amadou Diallo'),
  p('VAL-007', 'Validation', 'Escalade automatique',            'false',      'false', 'BOOLEEN', 'Escalader automatiquement après dépassement du délai de validation.',      false, true,  'EN_ATTENTE', '2026-04-01', 'Ibrahim Sanogo'),

  // ── Sécurité (7) ────────────────────────────────────────────────────────────
  p('SEC-001', 'Sécurité', 'Durée session (minutes)',          '480',   '60',    'NOMBRE',  "Durée maximale d'une session utilisateur avant déconnexion automatique.",  true,  true,  'ACTIF',      '2026-03-10', 'Ibrahim Sanogo'),
  p('SEC-002', 'Sécurité', 'Expiration mot de passe (jours)', '90',    '90',    'NOMBRE',  "Durée de validité d'un mot de passe avant renouvellement obligatoire.",   false, true,  'ACTIF',      '2026-03-10', 'Ibrahim Sanogo'),
  p('SEC-003', 'Sécurité', 'MFA actif',                       'false', 'false', 'BOOLEEN', "Activer l'authentification multi-facteurs pour tous les utilisateurs.",   false, true,  'EN_ATTENTE', '2026-04-15', 'Ibrahim Sanogo'),
  p('SEC-004', 'Sécurité', 'Tentatives connexion max',        '5',     '5',     'NOMBRE',  'Nombre de tentatives de connexion avant blocage du compte.',               true,  true,  'ACTIF',      '2026-03-10', 'Ibrahim Sanogo'),
  p('SEC-005', 'Sécurité', 'Liste blanche IP',                '[]',    '[]',    'JSON',    'Liste des adresses IP autorisées à accéder au système.',                   false, true,  'INACTIF',    '2026-03-15', 'Ibrahim Sanogo'),
  p('SEC-006', 'Sécurité', 'Journalisation connexions',       'true',  'true',  'BOOLEEN', 'Enregistrer toutes les connexions et déconnexions des utilisateurs.',      false, true,  'ACTIF',      '2026-03-10', 'Ibrahim Sanogo'),
  p('SEC-007', 'Sécurité', 'Restriction horaires',            'false', 'false', 'BOOLEEN', "Restreindre l'accès au système en dehors des heures ouvrées.",             false, true,  'INACTIF',    '2026-03-20', 'Amadou Diallo'),

  // ── Affichage (7) ───────────────────────────────────────────────────────────
  p('AFF-001', 'Affichage', 'Thème interface',     'system',     'system',     'LISTE',  "Thème visuel de l'interface (clair, sombre, système).",                  false, true,  'ACTIF',   '2026-04-05', 'Marie Coulibaly'),
  p('AFF-002', 'Affichage', 'Format date',         'DD/MM/YYYY', 'DD/MM/YYYY', 'LISTE',  "Format d'affichage des dates dans l'interface.",                          false, true,  'ACTIF',   '2026-04-05', 'Marie Coulibaly'),
  p('AFF-003', 'Affichage', 'Format nombre',       'FR',         'FR',         'LISTE',  "Format d'affichage des nombres (séparateurs décimal et milliers).",       false, true,  'ACTIF',   '2026-04-05', 'Marie Coulibaly'),
  p('AFF-004', 'Affichage', "Éléments par page",   '25',         '25',         'NOMBRE', "Nombre d'éléments affichés par page dans les tableaux.",                  false, true,  'ACTIF',   '2026-04-10', 'Marie Coulibaly'),
  p('AFF-005', 'Affichage', 'Langue interface',    'fr',         'fr',         'LISTE',  "Langue de l'interface utilisateur.",                                       false, true,  'ACTIF',   '2026-04-05', 'Amadou Diallo'),
  p('AFF-006', 'Affichage', 'Logo du projet',      '',           '',           'TEXTE',  "URL du logo du projet affiché dans l'entête de l'application.",            false, true,  'INACTIF', '2026-04-20', 'Marie Coulibaly'),
  p('AFF-007', 'Affichage', 'Mode compact tableaux', 'false', 'false', 'BOOLEEN', "Activer l'affichage compact pour les grands tableaux de données.",          false, true,  'ACTIF',   '2026-04-10', 'Marie Coulibaly'),

  // ── Archivage (5) ───────────────────────────────────────────────────────────
  p('ARC-001', 'Archivage', "Politique d'archivage",       'automatique', 'manuel',       'LISTE',  "Politique de déclenchement de l'archivage des données du projet.",        true,  true,  'ACTIF',   '2026-05-10', 'Souleymane Touré'),
  p('ARC-002', 'Archivage', 'Durée de rétention (années)', '10',          '7',            'NOMBRE', 'Durée de conservation des données archivées avant suppression définitive.',true,  true,  'ACTIF',   '2026-05-10', 'Souleymane Touré'),
  p('ARC-003', 'Archivage', 'Compression automatique',     'true',        'true',         'BOOLEEN', "Compresser automatiquement les documents lors de l'archivage.",          false, true,  'ACTIF',   '2026-05-15', 'Souleymane Touré'),
  p('ARC-004', 'Archivage', 'Suppression après archivage', 'false',       'false',        'BOOLEEN', 'Supprimer les fichiers sources après archivage confirmé.',               false, true,  'ACTIF',   '2026-05-10', 'Ibrahim Sanogo'),
  p('ARC-005', 'Archivage', 'Fréquence des sauvegardes',   'quotidienne', 'hebdomadaire', 'LISTE',  'Fréquence des sauvegardes automatiques de la base de données.',           true,  true,  'ACTIF',   '2026-06-01', 'Ibrahim Sanogo'),
];

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
  { id: 'conn-001', date: '28/06/2026 09:45', ip: '41.82.15.23', localisation: 'Dakar, Sénégal',      navigateur: 'Chrome 125',  statut: 'Succès' },
  { id: 'conn-002', date: '27/06/2026 16:20', ip: '41.82.15.24', localisation: 'Dakar, Sénégal',      navigateur: 'Safari 17',   statut: 'Succès' },
  { id: 'conn-003', date: '27/06/2026 08:55', ip: '196.200.54.12', localisation: 'Abidjan, CI',        navigateur: 'Firefox 128', statut: 'Succès' },
  { id: 'conn-004', date: '26/06/2026 21:10', ip: '154.72.165.85', localisation: 'Bamako, Mali',       navigateur: 'Safari 17',   statut: 'Succès' },
  { id: 'conn-005', date: '25/06/2026 14:30', ip: '92.104.0.1',   localisation: 'Paris, France',       navigateur: 'Chrome 124',  statut: 'Échec'  },
  { id: 'conn-006', date: '24/06/2026 11:00', ip: '41.82.15.23', localisation: 'Dakar, Sénégal',      navigateur: 'Chrome 125',  statut: 'Succès' },
];

export const mockChangeHistory: ChangeHistory[] = [
  { id: 'ch-001', champ: 'Email',         ancienneValeur: 'amadou.d@gmail.com',    nouvelleValeur: 'a.diallo@gpd-erp.org', date: '20/06/2026 10:15' },
  { id: 'ch-002', champ: 'Téléphone',     ancienneValeur: '+221 77 123 45 67',     nouvelleValeur: '+221 77 456 78 90',    date: '15/06/2026 14:30' },
  { id: 'ch-003', champ: 'Mot de passe',  ancienneValeur: '••••••••',              nouvelleValeur: '••••••••••••',         date: '10/06/2026 09:00' },
  { id: 'ch-004', champ: 'Langue',        ancienneValeur: 'English',               nouvelleValeur: 'Français',             date: '05/06/2026 16:45' },
  { id: 'ch-005', champ: 'Fuseau horaire', ancienneValeur: 'UTC',                  nouvelleValeur: 'Africa/Dakar',         date: '01/06/2026 11:20' },
  { id: 'ch-006', champ: 'Apparence',     ancienneValeur: 'Sombre',                nouvelleValeur: 'Système',              date: '28/05/2026 08:30' },
];
