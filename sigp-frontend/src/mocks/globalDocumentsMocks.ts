import type { CategorieGlobalDoc, StatutGlobalDoc, ConfidentialiteGlobalDoc, TypeFichier, DocumentGlobal } from '@/types';

// ─── Labels ───────────────────────────────────────────────────────────────────

export const STATUT_GLOBAL_DOC_LABEL: Record<StatutGlobalDoc, string> = {
  PUBLIE:        'Publié',
  BROUILLON:     'Brouillon',
  EN_VALIDATION: 'En validation',
  ARCHIVE:       'Archivé',
  EXPIRE:        'Expiré',
};

export const CONF_GLOBAL_DOC_LABEL: Record<ConfidentialiteGlobalDoc, string> = {
  PUBLIQUE:      'Publique',
  INTERNE:       'Interne',
  CONFIDENTIELLE:'Confidentielle',
  RESTREINTE:    'Restreinte',
};

export const TYPE_FICHIER_LABEL: Record<TypeFichier, string> = {
  PDF:   'PDF',
  Word:  'Word',
  Excel: 'Excel',
  Image: 'Image',
  ZIP:   'ZIP',
  Autre: 'Autre',
};

// ─── Options ──────────────────────────────────────────────────────────────────

export const CATEGORIES_GLOBAL_DOC: CategorieGlobalDoc[] = [
  'Administration', 'Procédures', 'Politiques', 'Guides',
  'Manuels', 'Modèles', 'Contrats modèles', 'Références',
  'Documentation technique', 'Documentation fonctionnelle', 'Archives',
];

export const CATEGORIE_GLOBAL_DOC_OPTIONS: { label: string; value: CategorieGlobalDoc }[] =
  CATEGORIES_GLOBAL_DOC.map(c => ({ label: c, value: c }));

export const STATUT_GLOBAL_DOC_OPTIONS: { label: string; value: StatutGlobalDoc }[] = [
  { label: 'Publié',        value: 'PUBLIE'        },
  { label: 'Brouillon',     value: 'BROUILLON'     },
  { label: 'En validation', value: 'EN_VALIDATION' },
  { label: 'Archivé',       value: 'ARCHIVE'       },
  { label: 'Expiré',        value: 'EXPIRE'        },
];

export const CONF_GLOBAL_DOC_OPTIONS: { label: string; value: ConfidentialiteGlobalDoc }[] = [
  { label: 'Publique',       value: 'PUBLIQUE'       },
  { label: 'Interne',        value: 'INTERNE'        },
  { label: 'Confidentielle', value: 'CONFIDENTIELLE' },
  { label: 'Restreinte',     value: 'RESTREINTE'     },
];

export const TYPE_FICHIER_OPTIONS: { label: string; value: TypeFichier }[] = [
  { label: 'PDF',   value: 'PDF'   },
  { label: 'Word',  value: 'Word'  },
  { label: 'Excel', value: 'Excel' },
  { label: 'Image', value: 'Image' },
  { label: 'ZIP',   value: 'ZIP'   },
  { label: 'Autre', value: 'Autre' },
];

export const AUTEURS_GLOBAL_DOC = [
  'Amadou Diallo', 'Fatima Koné', 'Ibrahim Sanogo',
  'Marie Coulibaly', 'Souleymane Touré',
];

export const SERVICES_GLOBAL_DOC = [
  'Direction Générale', 'Service Financier', 'Service Technique',
  'Service Juridique', 'Service RH', 'Service IT', 'Service Communication',
];

// ─── Factory ──────────────────────────────────────────────────────────────────

let _seq = 0;

function d(
  code: string,
  categorie: CategorieGlobalDoc,
  titre: string,
  type: TypeFichier,
  version: string,
  auteur: string,
  service: string,
  statut: StatutGlobalDoc,
  conf: ConfidentialiteGlobalDoc,
  taille_ko: number,
  nb_dl: number,
  date_creation: string,
  description: string,
  date_expiration?: string,
): DocumentGlobal {
  _seq++;
  const nb_v = parseInt(version.split('.')[0], 10) || 1;
  const versions = Array.from({ length: nb_v }, (_, i) => ({
    version:     `${i + 1}.0`,
    date:        date_creation,
    auteur,
    changements: i === 0 ? 'Version initiale' : `Mise à jour v${i + 1}.0`,
  }));
  return {
    id:                `gdoc-${String(_seq).padStart(3, '0')}`,
    code_document:     code,
    titre,
    description,
    categorie,
    type,
    statut,
    version,
    confidentialite:   conf,
    auteur,
    service,
    mots_cles:         [categorie.toLowerCase(), type.toLowerCase(), auteur.split(' ')[1].toLowerCase()],
    taille_ko,
    nb_telechargements: nb_dl,
    date_creation,
    date_modification: date_creation,
    date_expiration,
    nb_commentaires:   Math.floor(nb_dl / 10),
    versions,
    createdAt:         `${date_creation}T08:00:00.000Z`,
    updatedAt:         `${date_creation}T08:00:00.000Z`,
  };
}

// ─── 100 documents ────────────────────────────────────────────────────────────

export const MOCK_GLOBAL_DOCUMENTS: DocumentGlobal[] = [

  // ── Administration (10) ───────────────────────────────────────────────────
  d('DOC-ADM-001', 'Administration', 'Manuel de procédures administratives',      'PDF',   '3.2', 'Amadou Diallo',    'Direction Générale',  'PUBLIE',        'INTERNE',        2048,  87, '2026-01-10', "Manuel complet des procédures internes de la direction administrative."),
  d('DOC-ADM-002', 'Administration', 'Règlement intérieur 2026',                  'PDF',   '1.0', 'Ibrahim Sanogo',   'Direction Générale',  'PUBLIE',        'INTERNE',        1024,  65, '2026-01-15', "Règlement intérieur de la plateforme SIGP pour l'exercice 2026."),
  d('DOC-ADM-003', 'Administration', 'Organigramme général 2026',                 'Image', '2.0', 'Marie Coulibaly',  'Direction Générale',  'PUBLIE',        'PUBLIQUE',        512,  42, '2026-01-20', "Organigramme officiel de la structure organisationnelle 2026."),
  d('DOC-ADM-004', 'Administration', 'Plan de travail annuel 2026',               'Excel', '1.1', 'Amadou Diallo',    'Direction Générale',  'PUBLIE',        'INTERNE',        1536, 103, '2026-01-25', "Plan de travail détaillé pour toutes les équipes — exercice 2026."),
  d('DOC-ADM-005', 'Administration', "Rapport d'activité T1 2026",                'PDF',   '1.0', 'Fatima Koné',      'Direction Générale',  'PUBLIE',        'INTERNE',        3072,  58, '2026-04-05', "Rapport trimestriel des activités réalisées au premier trimestre 2026."),
  d('DOC-ADM-006', 'Administration', "Rapport d'activité T2 2026",                'PDF',   '1.0', 'Fatima Koné',      'Direction Générale',  'BROUILLON',     'INTERNE',        2560,   4, '2026-07-01', "Rapport trimestriel des activités du deuxième trimestre 2026 (en cours)."),
  d('DOC-ADM-007', 'Administration', 'Compte rendu réunion direction jan 2026',   'Word',  '1.0', 'Marie Coulibaly',  'Direction Générale',  'PUBLIE',        'INTERNE',         256,  31, '2026-01-31', "Procès-verbal de la réunion mensuelle de la direction — janvier 2026."),
  d('DOC-ADM-008', 'Administration', 'Compte rendu réunion direction fév 2026',   'Word',  '1.0', 'Marie Coulibaly',  'Direction Générale',  'PUBLIE',        'INTERNE',         256,  28, '2026-02-28', "Procès-verbal de la réunion mensuelle de la direction — février 2026."),
  d('DOC-ADM-009', 'Administration', 'Planning des réunions 2026',                'Excel', '1.0', 'Souleymane Touré', 'Direction Générale',  'PUBLIE',        'INTERNE',         128,  44, '2026-01-05', "Calendrier annuel de toutes les réunions institutionnelles 2026."),
  d('DOC-ADM-010', 'Administration', 'Budget de fonctionnement 2026',             'Excel', '2.0', 'Fatima Koné',      'Service Financier',   'PUBLIE',        'CONFIDENTIELLE', 4096,  19, '2026-01-20', "Budget de fonctionnement de la structure pour l'exercice 2026."),

  // ── Procédures (10) ──────────────────────────────────────────────────────
  d('DOC-PRO-001', 'Procédures', 'Procédure de passation des marchés',            'PDF',   '2.1', 'Souleymane Touré', 'Service Juridique',   'PUBLIE',        'PUBLIQUE',       2048,  92, '2025-09-15', "Procédure standardisée pour la passation des marchés publics."),
  d('DOC-PRO-002', 'Procédures', 'Procédure de validation budgétaire',            'PDF',   '1.3', 'Fatima Koné',      'Service Financier',   'PUBLIE',        'INTERNE',        1024,  76, '2025-10-01', "Processus de validation des engagements et dépenses budgétaires."),
  d('DOC-PRO-003', 'Procédures', 'Procédure de gestion des contrats',             'PDF',   '2.0', 'Souleymane Touré', 'Service Juridique',   'PUBLIE',        'INTERNE',        1536,  54, '2025-11-10', "Procédure complète de suivi et gestion du cycle de vie des contrats."),
  d('DOC-PRO-004', 'Procédures', 'Procédure de gestion des risques',              'Word',  '1.2', 'Ibrahim Sanogo',   'Service Technique',   'PUBLIE',        'INTERNE',         768,  41, '2025-12-05', "Méthodologie de gestion et de suivi des risques sur les projets."),
  d('DOC-PRO-005', 'Procédures', 'Procédure de décaissement',                     'PDF',   '3.0', 'Fatima Koné',      'Service Financier',   'PUBLIE',        'INTERNE',        1024,  88, '2026-01-10', "Procédure de traitement et de validation des demandes de décaissement."),
  d('DOC-PRO-006', 'Procédures', 'Procédure de rapport de progression',           'Word',  '1.1', 'Marie Coulibaly',  'Direction Générale',  'PUBLIE',        'INTERNE',         512,  35, '2026-02-01', "Procédure de préparation et de soumission des rapports de progression."),
  d('DOC-PRO-007', 'Procédures', 'Procédure de recrutement',                      'PDF',   '1.0', 'Ibrahim Sanogo',   'Service RH',          'PUBLIE',        'INTERNE',         768,  29, '2026-01-20', "Procédure de recrutement et de sélection du personnel pour les postes ouverts."),
  d('DOC-PRO-008', 'Procédures', "Procédure de gestion des actifs",               'Word',  '1.0', 'Fatima Koné',      'Service Financier',   'EN_VALIDATION', 'INTERNE',         512,   3, '2026-05-10', "Procédure de suivi et de gestion de l'inventaire des actifs."),
  d('DOC-PRO-009', "Procédures", "Procédure d'audit interne",                     'PDF',   '2.0', 'Amadou Diallo',    'Direction Générale',  'PUBLIE',        'CONFIDENTIELLE', 1024,  47, '2025-08-20', "Procédure de conduite des missions d'audit interne."),
  d('DOC-PRO-010', 'Procédures', 'Procédure de clôture de projet',               'PDF',   '1.0', 'Marie Coulibaly',  'Direction Générale',  'PUBLIE',        'INTERNE',        1280,  22, '2026-03-15', "Procédure formelle de clôture administrative et financière des projets."),

  // ── Politiques (10) ──────────────────────────────────────────────────────
  d('DOC-POL-001', 'Politiques', 'Politique de gestion financière',               'PDF',   '2.0', 'Fatima Koné',      'Service Financier',   'PUBLIE',        'PUBLIQUE',       2048,  74, '2025-06-01', "Politique globale de gestion financière et de contrôle budgétaire."),
  d('DOC-POL-002', 'Politiques', 'Politique anticorruption',                      'PDF',   '1.1', 'Amadou Diallo',    'Direction Générale',  'PUBLIE',        'PUBLIQUE',        512,  51, '2025-07-15', "Politique de lutte contre la corruption et les conflits d'intérêts."),
  d('DOC-POL-003', 'Politiques', 'Politique environnementale et sociale',         'PDF',   '3.0', 'Ibrahim Sanogo',   'Service Technique',   'PUBLIE',        'PUBLIQUE',       3072, 112, '2025-05-10', "Cadre de gestion environnementale et sociale conforme aux normes de la Banque Mondiale."),
  d('DOC-POL-004', 'Politiques', 'Politique de confidentialité des données',      'PDF',   '1.2', 'Ibrahim Sanogo',   'Service IT',          'PUBLIE',        'PUBLIQUE',        768,  63, '2025-11-01', "Politique de protection et de confidentialité des données personnelles."),
  d('DOC-POL-005', 'Politiques', 'Politique de genre et inclusion',               'Word',  '1.0', 'Marie Coulibaly',  'Service RH',          'PUBLIE',        'PUBLIQUE',        512,  38, '2026-02-10', "Politique de promotion de l'égalité de genre et de l'inclusion sociale."),
  d('DOC-POL-006', 'Politiques', 'Politique de sécurité informatique',            'PDF',   '2.1', 'Ibrahim Sanogo',   'Service IT',          'PUBLIE',        'INTERNE',        1024,  59, '2025-09-20', "Politique de sécurité des systèmes d'information et de protection des données."),
  d('DOC-POL-007', 'Politiques', 'Politique de gestion des ressources humaines',  'PDF',   '1.0', 'Amadou Diallo',    'Service RH',          'PUBLIE',        'INTERNE',        1536,  45, '2025-10-05', "Politique de gestion et de développement des ressources humaines."),
  d('DOC-POL-008', 'Politiques', 'Politique de communication externe',            'Word',  '1.0', 'Marie Coulibaly',  'Service Communication','BROUILLON',    'INTERNE',         384,   1, '2026-06-15', "Politique de communication institutionnelle et de relations publiques."),
  d('DOC-POL-009', 'Politiques', 'Politique de voyage et déplacements',           'PDF',   '1.3', 'Fatima Koné',      'Service Financier',   'PUBLIE',        'INTERNE',         512,  33, '2025-12-01', "Règles et conditions de prise en charge des voyages et déplacements officiels."),
  d('DOC-POL-010', "Politiques", "Politique de gestion des conflits d'intérêts",  'PDF',   '1.0', 'Amadou Diallo',    'Direction Générale',  'PUBLIE',        'PUBLIQUE',        640,  27, '2026-01-30', "Politique de prévention et de gestion des situations de conflits d'intérêts."),

  // ── Guides (10) ──────────────────────────────────────────────────────────
  d('DOC-GUI-001', 'Guides', 'Guide de gestion de projet',                        'PDF',   '2.0', 'Amadou Diallo',    'Direction Générale',  'PUBLIE',        'PUBLIQUE',       4096, 145, '2025-03-01', "Guide complet de gestion de projet selon les standards internationaux."),
  d('DOC-GUI-002', 'Guides', 'Guide utilisation SIGP v2',                         'PDF',   '2.3', 'Ibrahim Sanogo',   'Service IT',          'PUBLIE',        'INTERNE',        6144, 203, '2026-03-15', "Guide utilisateur complet de la plateforme SIGP version 2."),
  d('DOC-GUI-003', 'Guides', 'Guide des indicateurs de performance',              'Word',  '1.1', 'Marie Coulibaly',  'Service Technique',   'PUBLIE',        'INTERNE',        1024,  67, '2025-11-20', "Guide de définition, de calcul et de suivi des indicateurs de performance."),
  d('DOC-GUI-004', 'Guides', 'Guide de rédaction des rapports',                   'Word',  '1.0', 'Marie Coulibaly',  'Direction Générale',  'PUBLIE',        'INTERNE',         768,  54, '2025-10-15', "Guide méthodologique pour la rédaction de rapports de qualité."),
  d('DOC-GUI-005', 'Guides', 'Guide de passation des marchés Banque Mondiale',    'PDF',   '5.0', 'Souleymane Touré', 'Service Juridique',   'PUBLIE',        'PUBLIQUE',       8192, 189, '2024-09-01', "Guide officiel de la Banque Mondiale pour la passation des marchés dans les projets financés."),
  d('DOC-GUI-006', 'Guides', 'Guide des décaissements IDA',                       'PDF',   '4.1', 'Fatima Koné',      'Service Financier',   'PUBLIE',        'PUBLIQUE',       5120, 156, '2024-07-15', "Guide des procédures de décaissement pour les projets financés par l'IDA."),
  d('DOC-GUI-007', 'Guides', 'Guide de suivi-évaluation',                         'PDF',   '2.0', 'Marie Coulibaly',  'Service Technique',   'PUBLIE',        'PUBLIQUE',       3072,  98, '2025-05-20', "Guide méthodologique pour la mise en œuvre du suivi et de l'évaluation de projets."),
  d('DOC-GUI-008', 'Guides', 'Guide de gestion environnementale',                 'PDF',   '1.2', 'Ibrahim Sanogo',   'Service Technique',   'PUBLIE',        'PUBLIQUE',       2048,  72, '2025-08-10', "Guide de gestion des impacts environnementaux des projets de développement."),
  d('DOC-GUI-009', 'Guides', "Guide d'archivage documentaire",                    'Word',  '1.0', 'Souleymane Touré', 'Direction Générale',  'PUBLIE',        'INTERNE',         512,  31, '2026-02-20', "Guide pratique pour la gestion et l'archivage des documents institutionnels."),
  d('DOC-GUI-010', 'Guides', 'Guide de gestion des parties prenantes',            'PDF',   '1.0', 'Amadou Diallo',    'Service Communication','BROUILLON',    'INTERNE',        1024,   2, '2026-06-20', "Guide pour l'identification et la gestion des parties prenantes des projets."),

  // ── Manuels (9) ──────────────────────────────────────────────────────────
  d('DOC-MAN-001', 'Manuels', 'Manuel opérationnel du projet',                    'PDF',   '3.0', 'Amadou Diallo',    'Direction Générale',  'PUBLIE',        'INTERNE',        8192, 134, '2025-01-15', "Manuel de référence pour la mise en œuvre opérationnelle des projets."),
  d('DOC-MAN-002', 'Manuels', 'Manuel de gestion financière',                     'PDF',   '2.1', 'Fatima Koné',      'Service Financier',   'PUBLIE',        'INTERNE',        5120, 121, '2025-03-10', "Manuel détaillé des procédures de gestion financière et comptable."),
  d('DOC-MAN-003', 'Manuels', 'Manuel de passation des marchés',                  'PDF',   '2.0', 'Souleymane Touré', 'Service Juridique',   'PUBLIE',        'INTERNE',        6144, 109, '2025-04-05', "Manuel complet des procédures de passation des marchés du projet."),
  d('DOC-MAN-004', 'Manuels', 'Manuel suivi-évaluation',                          'PDF',   '1.2', 'Marie Coulibaly',  'Service Technique',   'PUBLIE',        'INTERNE',        4096,  88, '2025-06-20', "Manuel du système de suivi-évaluation et de gestion des résultats."),
  d('DOC-MAN-005', 'Manuels', 'Manuel de formation du personnel',                 'Word',  '1.0', 'Ibrahim Sanogo',   'Service RH',          'PUBLIE',        'INTERNE',        2048,  47, '2025-09-01', "Manuel de référence pour la formation et le renforcement des capacités."),
  d('DOC-MAN-006', 'Manuels', 'Manuel utilisation système comptable',             'PDF',   '1.1', 'Fatima Koné',      'Service Financier',   'PUBLIE',        'INTERNE',        3584,  63, '2025-10-15', "Manuel utilisateur complet du système comptable intégré."),
  d('DOC-MAN-007', 'Manuels', 'Manuel de gestion des bénéficiaires',              'PDF',   '1.0', 'Marie Coulibaly',  'Service Technique',   'EN_VALIDATION', 'INTERNE',        2048,   5, '2026-05-20', "Manuel de référence pour l'identification et la gestion des bénéficiaires."),
  d('DOC-MAN-008', 'Manuels', 'Manuel de sécurité et protection',                 'PDF',   '2.0', 'Ibrahim Sanogo',   'Service IT',          'PUBLIE',        'CONFIDENTIELLE', 1536,  34, '2025-11-10', "Manuel des procédures de sécurité physique et numérique."),
  d('DOC-MAN-009', 'Manuels', 'Manuel de gestion des données',                    'PDF',   '1.0', 'Ibrahim Sanogo',   'Service IT',          'PUBLIE',        'INTERNE',        2048,  41, '2026-01-25', "Manuel de collecte, de traitement et de protection des données du projet."),

  // ── Modèles (10) ─────────────────────────────────────────────────────────
  d('DOC-MOD-001', 'Modèles', 'Modèle rapport mensuel',                           'Word',  '2.0', 'Marie Coulibaly',  'Direction Générale',  'PUBLIE',        'INTERNE',         256, 178, '2025-06-01', "Gabarit standard pour la rédaction des rapports mensuels d'avancement."),
  d('DOC-MOD-002', 'Modèles', 'Modèle rapport trimestriel',                       'Word',  '2.1', 'Marie Coulibaly',  'Direction Générale',  'PUBLIE',        'INTERNE',         384, 142, '2025-06-01', "Gabarit standard pour la rédaction des rapports trimestriels d'avancement."),
  d('DOC-MOD-003', "Modèles", "Modèle TDR mission d'étude",                       'Word',  '1.2', 'Souleymane Touré', 'Service Juridique',   'PUBLIE',        'INTERNE',         192, 115, '2025-08-10', "Gabarit de termes de référence pour les missions d'étude et de conseil."),
  d('DOC-MOD-004', 'Modèles', 'Modèle PV de réception',                           'Word',  '1.0', 'Souleymane Touré', 'Service Technique',   'PUBLIE',        'INTERNE',         128,  97, '2025-09-15', "Gabarit de procès-verbal pour la réception de travaux, fournitures et services."),
  d('DOC-MOD-005', 'Modèles', 'Modèle note de service',                           'Word',  '1.0', 'Amadou Diallo',    'Direction Générale',  'PUBLIE',        'INTERNE',          96, 134, '2025-07-01', "Gabarit standard pour la rédaction des notes de service internes."),
  d('DOC-MOD-006', 'Modèles', 'Modèle compte rendu réunion',                      'Word',  '1.3', 'Marie Coulibaly',  'Direction Générale',  'PUBLIE',        'INTERNE',         128, 167, '2025-06-15', "Gabarit pour la rédaction des comptes rendus et procès-verbaux de réunion."),
  d('DOC-MOD-007', 'Modèles', 'Modèle fiche de projet',                           'Excel', '1.1', 'Amadou Diallo',    'Direction Générale',  'PUBLIE',        'INTERNE',         384, 189, '2025-07-20', "Fiche synthétique de présentation et de suivi d'un projet."),
  d('DOC-MOD-008', 'Modèles', 'Modèle plan de travail',                           'Excel', '2.0', 'Amadou Diallo',    'Direction Générale',  'PUBLIE',        'INTERNE',         512, 156, '2025-08-01', "Gabarit de plan de travail annuel et trimestriel."),
  d('DOC-MOD-009', 'Modèles', 'Modèle tableau de bord projet',                    'Excel', '1.0', 'Fatima Koné',      'Service Financier',   'PUBLIE',        'INTERNE',        1024, 123, '2026-01-05', "Gabarit de tableau de bord pour le suivi des indicateurs clés de projet."),
  d('DOC-MOD-010', 'Modèles', 'Modèle budget prévisionnel',                       'Excel', '1.2', 'Fatima Koné',      'Service Financier',   'PUBLIE',        'INTERNE',         768, 144, '2025-10-10', "Gabarit de présentation et de planification du budget prévisionnel."),

  // ── Contrats modèles (8) ──────────────────────────────────────────────────
  d('DOC-CTR-001', 'Contrats modèles', 'Modèle contrat consultants individuels',  'Word',  '2.0', 'Souleymane Touré', 'Service Juridique',   'PUBLIE',        'CONFIDENTIELLE',  768,  89, '2025-07-10', "Modèle type de contrat pour le recrutement de consultants individuels."),
  d('DOC-CTR-002', 'Contrats modèles', 'Modèle contrat de travaux',               'PDF',   '1.1', 'Souleymane Touré', 'Service Juridique',   'PUBLIE',        'CONFIDENTIELLE', 2048,  67, '2025-08-05', "Modèle type de contrat pour la réalisation de travaux de construction."),
  d('DOC-CTR-003', 'Contrats modèles', 'Modèle contrat de fournitures',           'Word',  '1.0', 'Souleymane Touré', 'Service Juridique',   'PUBLIE',        'CONFIDENTIELLE',  512,  54, '2025-09-01', "Modèle type de contrat pour la fourniture de biens et équipements."),
  d('DOC-CTR-004', 'Contrats modèles', 'Modèle contrat de services',              'Word',  '1.2', 'Souleymane Touré', 'Service Juridique',   'PUBLIE',        'CONFIDENTIELLE',  640,  71, '2025-09-15', "Modèle type de contrat pour la prestation de services intellectuels."),
  d('DOC-CTR-005', 'Contrats modèles', 'Modèle accord de financement',            'PDF',   '2.0', 'Amadou Diallo',    'Direction Générale',  'PUBLIE',        'RESTREINTE',     4096,  23, '2025-04-01', "Modèle type d'accord de financement avec les bailleurs de fonds."),
  d('DOC-CTR-006', 'Contrats modèles', 'Modèle avenant de contrat',               'Word',  '1.0', 'Souleymane Touré', 'Service Juridique',   'PUBLIE',        'CONFIDENTIELLE',  256,  48, '2025-10-01', "Modèle type pour la rédaction des avenants de modification de contrats."),
  d('DOC-CTR-007', 'Contrats modèles', 'Modèle convention de partenariat',        'PDF',   '1.0', 'Amadou Diallo',    'Direction Générale',  'EN_VALIDATION', 'RESTREINTE',     1536,   6, '2026-04-20', "Modèle de convention de partenariat avec les institutions partenaires."),
  d('DOC-CTR-008', "Contrats modèles", "Modèle protocole d'accord",               'Word',  '1.1', 'Amadou Diallo',    'Direction Générale',  'PUBLIE',        'RESTREINTE',      768,  31, '2026-02-15', "Modèle de protocole d'accord (MOU) pour les engagements institutionnels."),

  // ── Références (8) ───────────────────────────────────────────────────────
  d('DOC-REF-001', 'Références', 'Directives passation marchés BM 2024',          'PDF',   '1.0', 'Souleymane Touré', 'Service Juridique',   'PUBLIE',        'PUBLIQUE',       12288, 312, '2024-06-01', "Directives officielles de la Banque Mondiale pour la passation des marchés (édition 2024)."),
  d('DOC-REF-002', 'Références', 'Règles de décaissement IDA',                    'PDF',   '4.0', 'Fatima Koné',      'Service Financier',   'PUBLIE',        'PUBLIQUE',       10240, 245, '2024-01-15', "Manuel des règles et procédures de décaissement pour les projets IDA."),
  d('DOC-REF-003', 'Références', 'Circulaire budgétaire 2026',                    'PDF',   '1.0', 'Fatima Koné',      'Service Financier',   'PUBLIE',        'INTERNE',        2048,  87, '2026-01-10', "Circulaire relative aux instructions budgétaires pour l'exercice 2026."),
  d('DOC-REF-004', 'Références', 'Loi de finances 2026',                          'PDF',   '1.0', 'Ibrahim Sanogo',   'Service Financier',   'PUBLIE',        'PUBLIQUE',       8192, 198, '2026-01-01', "Loi de finances de la République pour l'exercice budgétaire 2026."),
  d('DOC-REF-005', 'Références', 'Code des marchés publics',                      'PDF',   '3.0', 'Souleymane Touré', 'Service Juridique',   'PUBLIE',        'PUBLIQUE',       5120, 267, '2023-07-01', "Code réglementaire des marchés publics en vigueur.",       '2027-06-30'),
  d('DOC-REF-006', 'Références', 'Règlement financier du gouvernement',           'PDF',   '2.0', 'Fatima Koné',      'Service Financier',   'EXPIRE',        'PUBLIQUE',       3072,  91, '2022-01-01', "Règlement financier de la gestion des deniers publics.",   '2025-12-31'),
  d('DOC-REF-007', 'Références', 'Normes comptables SYSCOHADA',                   'PDF',   '2.0', 'Fatima Koné',      'Service Financier',   'PUBLIE',        'PUBLIQUE',       6144, 143, '2023-10-01', "Normes du Système Comptable OHADA révisées, en vigueur depuis 2017."),
  d('DOC-REF-008', 'Références', 'Cadre de résultats et performance',             'Excel', '1.1', 'Marie Coulibaly',  'Service Technique',   'PUBLIE',        'INTERNE',        2048,  76, '2025-02-01', "Cadre logique de résultats et matrice de performance des projets."),

  // ── Documentation technique (9) ───────────────────────────────────────────
  d('DOC-TEC-001', 'Documentation technique', 'Architecture système SIGP v2',     'PDF',   '2.0', 'Ibrahim Sanogo',   'Service IT',          'PUBLIE',        'CONFIDENTIELLE', 8192,  78, '2025-12-01', "Documentation complète de l'architecture technique du système SIGP version 2."),
  d('DOC-TEC-002', 'Documentation technique', 'Documentation API REST SIGP',      'PDF',   '3.1', 'Ibrahim Sanogo',   'Service IT',          'PUBLIE',        'RESTREINTE',     5120,  67, '2026-02-01', "Référence complète des API REST exposées par le backend SIGP."),
  d('DOC-TEC-003', 'Documentation technique', "Guide d'installation serveurs",     'Word',  '1.2', 'Ibrahim Sanogo',   'Service IT',          'PUBLIE',        'RESTREINTE',     1536,  23, '2025-10-15', "Guide pas à pas pour l'installation et la configuration des serveurs d'application."),
  d('DOC-TEC-004', 'Documentation technique', 'Spécifications techniques BDD',    'PDF',   '2.0', 'Ibrahim Sanogo',   'Service IT',          'PUBLIE',        'CONFIDENTIELLE', 4096,  45, '2025-11-20', "Schéma et documentation complète de la base de données SIGP."),
  d('DOC-TEC-005', 'Documentation technique', 'Manuel sauvegarde et restauration','Word',  '1.0', 'Ibrahim Sanogo',   'Service IT',          'PUBLIE',        'RESTREINTE',     1024,  18, '2026-01-15', "Procédures de sauvegarde régulière et de restauration du système en cas de sinistre."),
  d('DOC-TEC-006', 'Documentation technique', 'Documentation sécurité SI',        'PDF',   '1.1', 'Ibrahim Sanogo',   'Service IT',          'PUBLIE',        'CONFIDENTIELLE', 3072,  34, '2025-09-10', "Documentation des mécanismes de sécurité du système d'information."),
  d('DOC-TEC-007', 'Documentation technique', 'Schéma réseau infrastructure',     'Image', '1.0', 'Ibrahim Sanogo',   'Service IT',          'PUBLIE',        'RESTREINTE',      512,  29, '2025-08-05', "Schéma topologique de l'infrastructure réseau de la plateforme."),
  d('DOC-TEC-008', 'Documentation technique', 'Plan de reprise après sinistre',   'PDF',   '2.0', 'Ibrahim Sanogo',   'Service IT',          'EN_VALIDATION', 'RESTREINTE',     2048,   4, '2026-06-01', "Plan de continuité et de reprise des activités en cas de sinistre majeur."),
  d('DOC-TEC-009', 'Documentation technique', 'Cahier de charges technique v1.2', 'PDF',   '1.2', 'Ibrahim Sanogo',   'Service IT',          'PUBLIE',        'CONFIDENTIELLE', 6144,  52, '2024-11-01', "Cahier des charges techniques pour le développement et la maintenance du SIGP."),

  // ── Documentation fonctionnelle (9) ───────────────────────────────────────
  d('DOC-FON-001', 'Documentation fonctionnelle', 'Cahier des charges SIGP',      'PDF',   '2.0', 'Amadou Diallo',    'Direction Générale',  'PUBLIE',        'INTERNE',       10240,  89, '2024-06-15', "Cahier des charges fonctionnel complet du système de gestion intégré SIGP."),
  d('DOC-FON-002', 'Documentation fonctionnelle', 'Dictionnaire des données',     'Excel', '1.1', 'Ibrahim Sanogo',   'Service IT',          'PUBLIE',        'INTERNE',        2048,  56, '2025-07-01', "Référentiel des données : définitions, types, sources et règles de gestion."),
  d('DOC-FON-003', 'Documentation fonctionnelle', 'Cartographie des processus',   'PDF',   '1.0', 'Amadou Diallo',    'Direction Générale',  'PUBLIE',        'INTERNE',        4096,  43, '2025-08-20', "Cartographie complète des processus métier de la plateforme SIGP."),
  d('DOC-FON-004', 'Documentation fonctionnelle', 'Spéc. fonctionnelles Budget',  'Word',  '2.0', 'Fatima Koné',      'Service Financier',   'PUBLIE',        'INTERNE',        2560,  38, '2025-10-05', "Spécifications fonctionnelles détaillées du module de gestion budgétaire."),
  d('DOC-FON-005', 'Documentation fonctionnelle', 'Spéc. fonctionnelles Marchés', 'Word',  '2.0', 'Souleymane Touré', 'Service Juridique',   'PUBLIE',        'INTERNE',        2560,  41, '2025-10-20', "Spécifications fonctionnelles détaillées du module de passation des marchés."),
  d('DOC-FON-006', "Documentation fonctionnelle", "Cas d'utilisation SIGP",       'PDF',   '1.0', 'Ibrahim Sanogo',   'Service IT',          'PUBLIE',        'INTERNE',        3072,  34, '2024-09-15', "Recueil des cas d'utilisation du système SIGP pour chaque profil utilisateur."),
  d('DOC-FON-007', 'Documentation fonctionnelle', 'Recueil des exigences',        'Word',  '1.1', 'Amadou Diallo',    'Direction Générale',  'PUBLIE',        'INTERNE',        1536,  29, '2024-10-01', "Recueil complet des exigences fonctionnelles et non-fonctionnelles du système."),
  d('DOC-FON-008', 'Documentation fonctionnelle', 'Plan de recette et tests',     'Excel', '1.0', 'Ibrahim Sanogo',   'Service IT',          'BROUILLON',     'INTERNE',        1024,   2, '2026-05-15', "Plan de recette fonctionnelle et de tests de non-régression du système SIGP."),
  d('DOC-FON-009', 'Documentation fonctionnelle', 'Guide de migration des données','PDF',  '1.0', 'Ibrahim Sanogo',   'Service IT',          'EN_VALIDATION', 'INTERNE',        2048,   3, '2026-06-10', "Guide technique et fonctionnel pour la migration des données vers SIGP v2."),

  // ── Archives (7) ─────────────────────────────────────────────────────────
  d('DOC-ARC-001', 'Archives', 'Rapport final projet SIGP Phase 1',               'PDF',   '1.0', 'Amadou Diallo',    'Direction Générale',  'ARCHIVE',       'INTERNE',        8192,  34, '2024-12-15', "Rapport final de clôture du projet SIGP Phase 1 (2022-2024)."),
  d('DOC-ARC-002', 'Archives', "Rapport d'audit 2024",                            'PDF',   '1.0', 'Fatima Koné',      'Service Financier',   'ARCHIVE',       'CONFIDENTIELLE', 5120,  12, '2025-03-01', "Rapport complet de l'audit financier et opérationnel pour l'exercice 2024."),
  d('DOC-ARC-003', 'Archives', 'Plan action 2024 (clos)',                         'Excel', '2.0', 'Amadou Diallo',    'Direction Générale',  'ARCHIVE',       'INTERNE',        2048,   8, '2025-01-10', "Plan d'action 2024 archivé après clôture de l'exercice."),
  d('DOC-ARC-004', 'Archives', 'Contrats archivés 2024',                          'ZIP',   '1.0', 'Souleymane Touré', 'Service Juridique',   'ARCHIVE',       'CONFIDENTIELLE', 51200, 3, '2025-01-20', "Archive compressée de tous les contrats conclus durant l'exercice 2024."),
  d('DOC-ARC-005', 'Archives', 'Correspondances officielles 2024',                'ZIP',   '1.0', 'Amadou Diallo',    'Direction Générale',  'ARCHIVE',       'CONFIDENTIELLE', 20480,  5, '2025-01-25', "Archive des correspondances officielles échangées avec les partenaires en 2024."),
  d('DOC-ARC-006', 'Archives', 'Rapport évaluation mi-parcours 2025',             'PDF',   '1.0', 'Marie Coulibaly',  'Service Technique',   'ARCHIVE',       'INTERNE',        4096,  21, '2025-06-30', "Rapport d'évaluation à mi-parcours réalisé au premier semestre 2025."),
  d('DOC-ARC-007', 'Archives', 'Budget final 2025',                               'Excel', '3.0', 'Fatima Koné',      'Service Financier',   'ARCHIVE',       'CONFIDENTIELLE', 3072,   9, '2026-01-05', "Budget finalisé et audité pour l'exercice 2025, archivé en janvier 2026."),
];
