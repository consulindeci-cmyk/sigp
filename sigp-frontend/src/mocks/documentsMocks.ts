import type {
  DocumentProjet, DocumentCategorie, TypeFichier,
  StatutDocument, ConfidentialiteDocument,
} from '@/types';

// ─── Listes normalisées ───────────────────────────────────────────────────────

export const DOCUMENT_CATEGORIES: DocumentCategorie[] = [
  'Contrat', 'Rapport', 'TDR', "Dossier d'AO", 'Compte-rendu',
  'Étude', 'Audit', 'Plan', 'Procédure', 'Autre',
];

export const TYPE_FICHIER_OPTIONS: { value: TypeFichier; label: string }[] = [
  { value: 'PDF',   label: 'PDF'   },
  { value: 'Word',  label: 'Word'  },
  { value: 'Excel', label: 'Excel' },
  { value: 'Image', label: 'Image' },
  { value: 'ZIP',   label: 'ZIP'   },
  { value: 'Autre', label: 'Autre' },
];

export const STATUT_DOCUMENT_OPTIONS: { value: StatutDocument; label: string }[] = [
  { value: 'BROUILLON',     label: 'Brouillon'     },
  { value: 'EN_VALIDATION', label: 'En validation' },
  { value: 'VALIDE',        label: 'Validé'        },
  { value: 'ARCHIVE',       label: 'Archivé'       },
];

export const CONFIDENTIALITE_OPTIONS: { value: ConfidentialiteDocument; label: string }[] = [
  { value: 'PUBLIQUE',       label: 'Publique'       },
  { value: 'INTERNE',        label: 'Interne'        },
  { value: 'CONFIDENTIELLE', label: 'Confidentielle' },
];

// ─── Helper ───────────────────────────────────────────────────────────────────

function d(
  id: string, code: string, titre: string, desc: string,
  cat: DocumentCategorie, activite: string | undefined,
  version: string, auteur: string, responsable: string,
  creation: string, statut: StatutDocument,
  taille: number, type: TypeFichier,
  mots: string[], conf: ConfidentialiteDocument,
): DocumentProjet {
  return {
    id, projet_id: 'mock-proj-01', code_document: code,
    titre, description: desc, categorie: cat, activite_liee: activite,
    version, auteur, responsable,
    date_creation: creation, date_modification: creation,
    statut, taille_ko: taille, type_fichier: type,
    mots_cles: mots, confidentialite: conf,
    createdAt: `${creation}T08:00:00.000Z`,
    updatedAt:  `${creation}T10:00:00.000Z`,
  };
}

// ─── Mock data — 22 documents ─────────────────────────────────────────────────

export const MOCK_DOCUMENTS: DocumentProjet[] = [
  // Janvier 2026
  d('doc-001', 'DOC-001',
    'Contrat de prestation de services — Bureau d\'études SETEC',
    'Contrat principal liant le projet au bureau d\'études SETEC pour les études techniques de la composante A.',
    'Contrat', 'Composante A — Infrastructures',
    '1.0', 'Amadou Diallo', 'Sékou Touré',
    '2026-01-10', 'VALIDE', 2800, 'PDF',
    ['contrat', 'prestation', 'SETEC'], 'CONFIDENTIELLE'),

  d('doc-002', 'DOC-002',
    'Plan de travail annuel 2026 — Version définitive',
    'Document de planification opérationnelle annuelle déclinant les objectifs par composante et par trimestre.',
    'Plan', undefined,
    '2.0', 'Fatoumata Koné', 'Amadou Diallo',
    '2026-01-15', 'VALIDE', 850, 'Word',
    ['plan', 'planification', '2026'], 'INTERNE'),

  d('doc-003', 'DOC-003',
    'Rapport de démarrage du projet — Mission de lancement',
    'Rapport officiel marquant le démarrage effectif des activités, soumis au bailleur IDA pour validation.',
    'Rapport', undefined,
    '1.0', 'Mariam Camara', 'Amadou Diallo',
    '2026-01-20', 'EN_VALIDATION', 4200, 'PDF',
    ['rapport', 'démarrage', 'IDA'], 'PUBLIQUE'),

  // Février 2026
  d('doc-004', 'DOC-004',
    'Étude d\'impact environnemental et social (EIES)',
    'Étude EIES conforme aux standards Banque Mondiale; cadre de gestion environnementale et plans de mitigation.',
    'Étude', 'Composante A — Infrastructures',
    '1.0', 'Ibrahima Souaré', 'Amadou Diallo',
    '2026-02-05', 'VALIDE', 15700, 'PDF',
    ['EIES', 'environnement', 'social'], 'PUBLIQUE'),

  d('doc-005', 'DOC-005',
    'TDR — Recrutement Expert Technique Eau & Assainissement',
    'Termes de référence pour le recrutement d\'un expert technique spécialisé en eau et assainissement.',
    'TDR', 'Composante A — Infrastructures',
    '1.0', 'Sékou Touré', 'Fatoumata Koné',
    '2026-02-10', 'VALIDE', 650, 'PDF',
    ['TDR', 'recrutement', 'expert'], 'INTERNE'),

  d('doc-006', 'DOC-006',
    'Dossier d\'appel d\'offres — Travaux civils lot 1',
    'DAO complet pour les travaux civils du lot 1 (pistes rurales, ouvrages hydrauliques, zone nord).',
    "Dossier d'AO", 'Composante A — Infrastructures',
    '1.0', 'Amadou Diallo', 'Ibrahima Souaré',
    '2026-02-15', 'EN_VALIDATION', 12300, 'PDF',
    ["appel d'offres", 'travaux', 'lot 1'], 'INTERNE'),

  d('doc-007', 'DOC-007',
    'Compte-rendu Comité de pilotage — Février 2026',
    'Procès-verbal de la 2e réunion du Comité de pilotage du projet, tenue le 28 février 2026.',
    'Compte-rendu', undefined,
    '1.0', 'Fatoumata Koné', 'Fatoumata Koné',
    '2026-02-28', 'ARCHIVE', 340, 'Word',
    ['comité', 'pilotage', 'CR'], 'INTERNE'),

  // Mars 2026
  d('doc-008', 'DOC-008',
    'Rapport trimestriel T1 2026 — Bailleur IDA',
    'Rapport narratif et financier du 1er trimestre 2026 soumis à la Banque Mondiale selon le calendrier convenu.',
    'Rapport', undefined,
    '1.0', 'Mariam Camara', 'Amadou Diallo',
    '2026-03-31', 'VALIDE', 8500, 'PDF',
    ['rapport', 'T1', 'trimestriel'], 'PUBLIQUE'),

  d('doc-009', 'DOC-009',
    'Manuel des procédures administratives et financières',
    'Manuel de référence pour toutes les procédures de gestion administrative, financière et comptable du projet.',
    'Procédure', undefined,
    '1.2', 'Ibrahima Souaré', 'Sékou Touré',
    '2026-03-15', 'VALIDE', 3200, 'PDF',
    ['procédures', 'manuel', 'finance'], 'INTERNE'),

  d('doc-010', 'DOC-010',
    'Photos chantier — Zone nord, mars 2026',
    'Archive photographique des travaux en cours sur la zone nord: forage puits P-04 à P-07.',
    'Autre', 'Composante A — Infrastructures',
    '1.0', 'Sékou Touré', 'Ibrahima Souaré',
    '2026-03-25', 'ARCHIVE', 48000, 'ZIP',
    ['photos', 'chantier', 'zone nord'], 'INTERNE'),

  d('doc-011', 'DOC-011',
    'TDR — Consultant en renforcement des capacités organisationnelles',
    'Termes de référence pour le recrutement d\'un consultant en formation et renforcement des capacités.',
    'TDR', 'Composante B — Renforcement des Capacités',
    '1.0', 'Amadou Diallo', 'Fatoumata Koné',
    '2026-03-10', 'ARCHIVE', 430, 'Word',
    ['TDR', 'consultant', 'formation'], 'INTERNE'),

  // Avril 2026
  d('doc-012', 'DOC-012',
    'Dossier d\'appel d\'offres — Fournitures et équipements informatiques',
    'DAO pour l\'acquisition des équipements informatiques destinés aux bureaux régionaux du projet.',
    "Dossier d'AO", undefined,
    '1.0', 'Fatoumata Koné', 'Amadou Diallo',
    '2026-04-05', 'EN_VALIDATION', 8700, 'PDF',
    ["appel d'offres", 'fournitures', 'informatique'], 'INTERNE'),

  d('doc-013', 'DOC-013',
    'Rapport financier T1 2026 — Analyse des dépenses',
    'Analyse détaillée des dépenses du 1er trimestre, par composante et par catégorie budgétaire.',
    'Rapport', undefined,
    '1.0', 'Mariam Camara', 'Sékou Touré',
    '2026-04-10', 'VALIDE', 920, 'Excel',
    ['rapport financier', 'dépenses', 'T1'], 'CONFIDENTIELLE'),

  d('doc-014', 'DOC-014',
    'Plan de passation des marchés 2026 — Révision 1',
    'Mise à jour du PPM intégrant les ajustements suite aux recommandations de la mission de supervision IDA.',
    'Plan', undefined,
    '1.1', 'Ibrahima Souaré', 'Amadou Diallo',
    '2026-04-20', 'ARCHIVE', 1200, 'Word',
    ['PPM', 'passation', 'marchés'], 'INTERNE'),

  // Mai 2026
  d('doc-015', 'DOC-015',
    'Rapport d\'avancement mai 2026',
    'Rapport mensuel d\'avancement des activités présenté lors de la réunion de coordination du 30 mai 2026.',
    'Rapport', undefined,
    '1.0', 'Sékou Touré', 'Amadou Diallo',
    '2026-05-30', 'EN_VALIDATION', 2100, 'Word',
    ['rapport', 'avancement', 'mensuel'], 'PUBLIQUE'),

  d('doc-016', 'DOC-016',
    'Rapport d\'audit interne — Mi-parcours 2026',
    'Rapport d\'audit interne couvrant la période janvier-avril 2026; conformité procédures et utilisation des fonds.',
    'Audit', undefined,
    '1.0', 'Amadou Diallo', 'Amadou Diallo',
    '2026-05-15', 'EN_VALIDATION', 6200, 'PDF',
    ['audit', 'mi-parcours', 'conformité'], 'CONFIDENTIELLE'),

  d('doc-017', 'DOC-017',
    'Plan de sécurité et santé — Chantiers composante A',
    'Plan HSE applicable aux chantiers de construction de la composante A, rédigé conformément aux normes locales.',
    'Plan', 'Composante A — Infrastructures',
    '0.9', 'Fatoumata Koné', 'Ibrahima Souaré',
    '2026-05-20', 'BROUILLON', 1800, 'PDF',
    ['sécurité', 'HSE', 'chantier'], 'INTERNE'),

  d('doc-018', 'DOC-018',
    'Compte-rendu — Réunion bailleur IDA, mai 2026',
    'Procès-verbal de la réunion de supervision trimestrielle avec la mission IDA tenue le 22 mai 2026.',
    'Compte-rendu', undefined,
    '1.0', 'Mariam Camara', 'Amadou Diallo',
    '2026-05-22', 'VALIDE', 520, 'PDF',
    ['bailleur', 'IDA', 'supervision'], 'INTERNE'),

  // Juin 2026
  d('doc-019', 'DOC-019',
    'Rapport trimestriel T2 2026 — Version brouillon',
    'Première version du rapport narratif et financier T2 en cours de consolidation avant soumission au bailleur.',
    'Rapport', undefined,
    '0.5', 'Ibrahima Souaré', 'Amadou Diallo',
    '2026-06-25', 'BROUILLON', 3100, 'Word',
    ['rapport', 'T2', 'brouillon'], 'INTERNE'),

  d('doc-020', 'DOC-020',
    'Rapport financier juin 2026 — Tableau de bord',
    'Tableau de bord financier mensuel juin 2026: exécution budgétaire, décaissements et projections.',
    'Rapport', undefined,
    '0.8', 'Sékou Touré', 'Mariam Camara',
    '2026-06-28', 'BROUILLON', 880, 'Excel',
    ['financier', 'juin', 'tableau de bord'], 'CONFIDENTIELLE'),

  d('doc-021', 'DOC-021',
    'Photos chantier — Zone sud, juin 2026',
    'Archive photographique des travaux de juin 2026 sur la zone sud: réseaux d\'eau, routes d\'accès.',
    'Autre', 'Composante A — Infrastructures',
    '1.0', 'Amadou Diallo', 'Ibrahima Souaré',
    '2026-06-20', 'BROUILLON', 39000, 'ZIP',
    ['photos', 'chantier', 'zone sud'], 'INTERNE'),

  d('doc-022', 'DOC-022',
    'Plan d\'action correctif Q3 2026',
    'Plan d\'action corrective suite aux recommandations de l\'audit mi-parcours, applicable sur Q3 2026.',
    'Plan', undefined,
    '0.7', 'Fatoumata Koné', 'Amadou Diallo',
    '2026-06-30', 'BROUILLON', 650, 'Excel',
    ['plan', 'correctif', 'Q3'], 'INTERNE'),
];
