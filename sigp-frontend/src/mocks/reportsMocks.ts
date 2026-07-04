import type { RapportProjet, TypeRapport, StatutRapport, FormatRapport } from '@/types';

// ─── Listes normalisées ───────────────────────────────────────────────────────

export const TYPE_RAPPORT_LABEL: Record<TypeRapport, string> = {
  MENSUEL:     'Mensuel',
  TRIMESTRIEL: 'Trimestriel',
  ANNUEL:      'Annuel',
  FINANCIER:   'Financier',
  EVM:         'EVM',
  RISQUES:     'Risques',
  PTBA:        'PTBA',
  BAILLEUR:    'Bailleur',
  AVANCEMENT:  'Avancement',
  FINAL:       'Final',
};

export const TYPE_RAPPORT_OPTIONS: { value: TypeRapport; label: string }[] = [
  { value: 'MENSUEL',     label: 'Mensuel'      },
  { value: 'TRIMESTRIEL', label: 'Trimestriel'  },
  { value: 'ANNUEL',      label: 'Annuel'       },
  { value: 'FINANCIER',   label: 'Financier'    },
  { value: 'EVM',         label: 'EVM'          },
  { value: 'RISQUES',     label: 'Risques'      },
  { value: 'PTBA',        label: 'PTBA'         },
  { value: 'BAILLEUR',    label: 'Bailleur'     },
  { value: 'AVANCEMENT',  label: 'Avancement'   },
  { value: 'FINAL',       label: 'Final'        },
];

export const STATUT_RAPPORT_OPTIONS: { value: StatutRapport; label: string }[] = [
  { value: 'GENERE',     label: 'Généré'    },
  { value: 'EN_ATTENTE', label: 'En attente' },
  { value: 'VALIDE',     label: 'Validé'    },
  { value: 'ARCHIVE',    label: 'Archivé'   },
];

export const FORMAT_RAPPORT_OPTIONS: { value: FormatRapport; label: string }[] = [
  { value: 'PDF',   label: 'PDF'   },
  { value: 'Excel', label: 'Excel' },
  { value: 'Word',  label: 'Word'  },
];

// ─── Helper ───────────────────────────────────────────────────────────────────

function r(
  id: string, code: string, titre: string, desc: string,
  type: TypeRapport, format: FormatRapport, statut: StatutRapport,
  periode: string, dateGen: string, version: string, auteur: string,
  taille: number, dlCount: number, commentaires?: string,
): RapportProjet {
  return {
    id, projet_id: 'mock-proj-01', code_rapport: code,
    titre, description: desc, type, format, statut,
    periode, date_generation: dateGen,
    date_telechargement: dlCount > 0 ? dateGen : undefined,
    version, auteur, taille_ko: taille,
    nb_telechargements: dlCount, commentaires,
    createdAt: `${dateGen}T08:00:00.000Z`,
    updatedAt:  `${dateGen}T10:00:00.000Z`,
  };
}

// ─── Mock data — 22 rapports ──────────────────────────────────────────────────

export const MOCK_RAPPORTS: RapportProjet[] = [

  // Janvier 2026
  r('rpt-001', 'RPT-001',
    'Rapport annuel 2025 — Bilan et perspectives',
    "Rapport de clôture de l'exercice 2025 présentant les résultats consolidés, l'exécution budgétaire et les recommandations pour 2026.",
    'ANNUEL', 'PDF', 'ARCHIVE', 'Annuel 2025', '2026-01-10', '1.0',
    'Amadou Diallo', 12500, 89, 'Rapport soumis au bailleur IDA et archivé après validation.'),

  r('rpt-002', 'RPT-002',
    'Rapport mensuel — Janvier 2026',
    "Rapport narratif d'avancement des activités du mois de janvier 2026 par composante.",
    'MENSUEL', 'PDF', 'VALIDE', 'Janvier 2026', '2026-01-31', '1.0',
    'Amadou Diallo', 3200, 45),

  r('rpt-003', 'RPT-003',
    'Rapport financier — Janvier 2026',
    'Tableau de bord financier mensuel: exécution budgétaire, décaissements et projections janvier 2026.',
    'FINANCIER', 'Excel', 'VALIDE', 'Janvier 2026', '2026-01-31', '1.0',
    'Fatoumata Koné', 1500, 28),

  // Février 2026
  r('rpt-004', 'RPT-004',
    'Rapport EVM — T1 2026',
    'Analyse de la valeur acquise (EVM) pour le premier trimestre 2026: CPI, SPI, EAC et courbe S.',
    'EVM', 'PDF', 'VALIDE', 'T1 2026', '2026-02-05', '1.0',
    'Ibrahima Souaré', 2800, 18),

  r('rpt-005', 'RPT-005',
    'Rapport mensuel — Février 2026',
    "Rapport narratif d'avancement des activités du mois de février 2026.",
    'MENSUEL', 'PDF', 'VALIDE', 'Février 2026', '2026-02-28', '1.0',
    'Amadou Diallo', 3100, 38),

  r('rpt-006', 'RPT-006',
    'Rapport des risques — T1 2026',
    'Tableau de bord des risques projet du T1 2026: niveaux de criticité, évolution et mesures de mitigation.',
    'RISQUES', 'PDF', 'VALIDE', 'T1 2026', '2026-02-15', '1.0',
    'Mariam Camara', 4500, 35),

  // Mars 2026
  r('rpt-007', 'RPT-007',
    'Rapport mensuel — Mars 2026',
    "Rapport narratif d'avancement des activités du mois de mars 2026.",
    'MENSUEL', 'PDF', 'VALIDE', 'Mars 2026', '2026-03-31', '1.0',
    'Amadou Diallo', 3300, 55),

  r('rpt-008', 'RPT-008',
    'Rapport trimestriel T1 2026 — Bailleur IDA',
    'Rapport narratif et financier du 1er trimestre 2026 soumis à la Banque Mondiale: résultats, décaissements, indicateurs.',
    'TRIMESTRIEL', 'PDF', 'VALIDE', 'T1 2026', '2026-03-31', '1.0',
    'Amadou Diallo', 8900, 67, 'Rapport validé par le bailleur le 18 avril 2026.'),

  r('rpt-009', 'RPT-009',
    'Rapport financier T1 2026 — Analyse des dépenses',
    'Analyse détaillée des dépenses du T1 2026 par composante et ligne budgétaire avec projections annuelles.',
    'FINANCIER', 'Excel', 'VALIDE', 'T1 2026', '2026-03-31', '2.0',
    'Fatoumata Koné', 2100, 43),

  // Avril 2026
  r('rpt-010', 'RPT-010',
    'Rapport bailleur IDA — T1 2026 (Version officielle)',
    'Version officielle du rapport de supervision IDA T1 2026 incluant les recommandations de la mission de supervision.',
    'BAILLEUR', 'Word', 'VALIDE', 'T1 2026', '2026-04-01', '1.0',
    'Sékou Touré', 5200, 31),

  r('rpt-011', 'RPT-011',
    'Rapport PTBA — Avancement Q1 2026',
    "État d'avancement du Plan de Travail et Budget Annuel au 31 mars 2026 par activité et composante.",
    'PTBA', 'Word', 'VALIDE', 'T1 2026', '2026-04-05', '1.0',
    'Sékou Touré', 4100, 19),

  r('rpt-012', 'RPT-012',
    'Rapport mensuel — Avril 2026',
    "Rapport narratif d'avancement des activités du mois d'avril 2026.",
    'MENSUEL', 'PDF', 'VALIDE', 'Avril 2026', '2026-04-30', '1.0',
    'Amadou Diallo', 3150, 42),

  r('rpt-013', 'RPT-013',
    'Rapport EVM — T2 2026 (Intermédiaire)',
    'Analyse EVM intermédiaire du second trimestre 2026 avec mise à jour des prévisions d\'achèvement.',
    'EVM', 'PDF', 'GENERE', 'T2 2026', '2026-04-30', '1.0',
    'Ibrahima Souaré', 2600, 8),

  // Mai 2026
  r('rpt-014', 'RPT-014',
    'Rapport mensuel — Mai 2026',
    "Rapport narratif d'avancement des activités du mois de mai 2026.",
    'MENSUEL', 'PDF', 'VALIDE', 'Mai 2026', '2026-05-31', '1.0',
    'Amadou Diallo', 3250, 35),

  r('rpt-015', 'RPT-015',
    'Rapport financier — Mai 2026',
    'Tableau de bord financier mensuel mai 2026 — en attente de validation par le Responsable Financier.',
    'FINANCIER', 'Excel', 'EN_ATTENTE', 'Mai 2026', '2026-05-31', '0.9',
    'Fatoumata Koné', 1600, 3, 'Version préliminaire soumise à la validation du RF.'),

  r('rpt-016', 'RPT-016',
    'Rapport des risques — Mai 2026',
    'Mise à jour du registre des risques avec évaluation du niveau de criticité et suivi du plan de mitigation.',
    'RISQUES', 'PDF', 'EN_ATTENTE', 'Mai 2026', '2026-05-20', '1.0',
    'Mariam Camara', 3800, 5),

  r('rpt-017', 'RPT-017',
    'Rapport d\'avancement T2 2026 — Version préliminaire',
    'Première version du rapport d\'avancement T2 consolidant les données de toutes les composantes projet.',
    'AVANCEMENT', 'Word', 'GENERE', 'T2 2026', '2026-05-28', '0.8',
    'Ibrahima Souaré', 3900, 7),

  // Juin 2026
  r('rpt-018', 'RPT-018',
    'Rapport mensuel — Juin 2026',
    "Rapport narratif d'avancement des activités du mois de juin 2026 — en cours de finalisation.",
    'MENSUEL', 'PDF', 'EN_ATTENTE', 'Juin 2026', '2026-06-30', '0.9',
    'Amadou Diallo', 3400, 0),

  r('rpt-019', 'RPT-019',
    'Rapport trimestriel T2 2026 — Bailleur IDA',
    'Rapport narratif et financier du 2e trimestre 2026 en cours de consolidation pour soumission IDA.',
    'TRIMESTRIEL', 'PDF', 'EN_ATTENTE', 'T2 2026', '2026-06-30', '0.5',
    'Amadou Diallo', 9200, 0, 'Version provisoire — consolidation en cours.'),

  r('rpt-020', 'RPT-020',
    'Rapport financier T2 2026 — Analyse des dépenses',
    'Analyse des dépenses du 2e trimestre 2026 par composante avec écarts budget/réalisé.',
    'FINANCIER', 'Excel', 'GENERE', 'T2 2026', '2026-06-28', '1.0',
    'Fatoumata Koné', 2300, 2),

  r('rpt-021', 'RPT-021',
    'Rapport bailleur IDA — T2 2026',
    'Rapport de supervision IDA du 2e trimestre 2026 incluant les données de performance et de décaissement.',
    'BAILLEUR', 'Word', 'GENERE', 'T2 2026', '2026-06-25', '1.0',
    'Sékou Touré', 5800, 1),

  r('rpt-022', 'RPT-022',
    'Rapport PTBA — Bilan mi-année 2026',
    "Bilan de l'exécution du PTBA au 30 juin 2026: taux de réalisation par activité et ajustements prévus.",
    'PTBA', 'PDF', 'ARCHIVE', 'S1 2026', '2026-06-15', '1.0',
    'Sékou Touré', 4700, 24, 'Version archivée suite à révision du PTBA.'),
];

// ─── Legacy types — used by src/components/reports/ and src/pages/ReportsPage.tsx ──

export type ReportCategory =
  | 'Synthèse & Tableau de bord'
  | 'Budget & Finance'
  | 'Planification & PTBA'
  | 'Cadre Logique'
  | 'Marchés & Contrats'
  | 'Risques'
  | 'EVM & Performance'
  | 'Ressources Humaines'
  | 'Portefeuille';

export type ReportFormat    = 'PDF' | 'XLSX' | 'CSV' | 'DOCX';
export type ReportFrequency = 'Manuel' | 'Quotidien' | 'Hebdomadaire' | 'Mensuel' | 'Trimestriel';
export type ReportStatus    = 'Disponible' | 'Archivé';
export type GeneratedStatus = 'Succès' | 'Erreur' | 'En cours';

export interface ReportTemplate {
  id: string;
  code: string;
  nom: string;
  categorie: ReportCategory;
  description: string;
  formatsDisponibles: ReportFormat[];
  auteur: string;
  dateCreation: string;
  dateDernierExport: string;
  statut: ReportStatus;
  frequence: ReportFrequency;
  favori: boolean;
  nombreExports: number;
}

export interface GeneratedReport {
  id: string;
  reportCode: string;
  reportNom: string;
  format: ReportFormat;
  dateGeneration: string;
  genereePar: string;
  taille: string;
  statut: GeneratedStatus;
  categorie: ReportCategory;
}

export interface ReportsKPIs {
  totalTemplates: number;
  generesParMois: number;
  favoris: number;
  planifies: number;
}

export interface MonthlyExportsData {
  mois: string;
  exports: number;
}

export const mockReportTemplates: ReportTemplate[] = [
  { id: 'rt1',  code: 'RPT-TDB',  nom: 'Tableau de Bord Portefeuille',        categorie: 'Synthèse & Tableau de bord', description: "Vue synthétique de l'ensemble du portefeuille.",           formatsDisponibles: ['PDF', 'XLSX'],         auteur: 'Amadou Diallo',    dateCreation: '2023-02-01', dateDernierExport: '2026-06-28', statut: 'Disponible', frequence: 'Mensuel',       favori: true,  nombreExports: 48  },
  { id: 'rt2',  code: 'RPT-FIN',  nom: 'Rapport Financier Mensuel',            categorie: 'Budget & Finance',           description: "Synthèse de l'exécution budgétaire et des décaissements.",  formatsDisponibles: ['PDF', 'XLSX', 'CSV'],  auteur: 'Fatoumata Koné',   dateCreation: '2023-02-01', dateDernierExport: '2026-06-25', statut: 'Disponible', frequence: 'Mensuel',       favori: true,  nombreExports: 42  },
  { id: 'rt3',  code: 'RPT-BUD',  nom: "État d'Exécution Budgétaire",          categorie: 'Budget & Finance',           description: "Détail ligne par ligne de l'exécution budgétaire.",          formatsDisponibles: ['XLSX', 'CSV'],         auteur: 'Moussa Traoré',    dateCreation: '2023-03-15', dateDernierExport: '2026-06-22', statut: 'Disponible', frequence: 'Hebdomadaire',  favori: false, nombreExports: 156 },
  { id: 'rt4',  code: 'RPT-PTBA', nom: 'Rapport PTBA Trimestriel',             categorie: 'Planification & PTBA',       description: "Bilan d'avancement du Plan de Travail et Budget Annuel.",    formatsDisponibles: ['PDF', 'XLSX'],         auteur: 'Ibrahim Maïga',    dateCreation: '2023-04-01', dateDernierExport: '2026-06-01', statut: 'Disponible', frequence: 'Trimestriel',   favori: true,  nombreExports: 12  },
  { id: 'rt5',  code: 'RPT-WBS',  nom: 'Avancement Activités WBS',             categorie: 'Planification & PTBA',       description: "Tableau de bord de la structure de découpage du travail.",    formatsDisponibles: ['XLSX', 'CSV'],         auteur: 'Aminata Cissé',    dateCreation: '2023-05-10', dateDernierExport: '2026-06-18', statut: 'Disponible', frequence: 'Manuel',        favori: false, nombreExports: 24  },
  { id: 'rt6',  code: 'RPT-CL',   nom: 'Rapport Cadre Logique',                categorie: 'Cadre Logique',              description: "Matrice du cadre logique avec les indicateurs.",              formatsDisponibles: ['PDF', 'XLSX'],         auteur: 'Aissatou Diop',    dateCreation: '2023-06-01', dateDernierExport: '2026-05-30', statut: 'Disponible', frequence: 'Mensuel',       favori: false, nombreExports: 18  },
  { id: 'rt7',  code: 'RPT-PPM',  nom: 'Plan de Passation des Marchés',        categorie: 'Marchés & Contrats',         description: "État complet du PPM avec les délais et écarts.",             formatsDisponibles: ['PDF', 'XLSX'],         auteur: 'Oumar Sanogo',     dateCreation: '2023-04-20', dateDernierExport: '2026-06-10', statut: 'Disponible', frequence: 'Manuel',        favori: false, nombreExports: 14  },
  { id: 'rt8',  code: 'RPT-CTR',  nom: 'Suivi des Contrats',                   categorie: 'Marchés & Contrats',         description: "Tableau de bord des contrats actifs.",                        formatsDisponibles: ['XLSX', 'CSV'],         auteur: 'Oumar Sanogo',     dateCreation: '2023-05-15', dateDernierExport: '2026-06-27', statut: 'Disponible', frequence: 'Hebdomadaire',  favori: false, nombreExports: 89  },
  { id: 'rt9',  code: 'RPT-DEC',  nom: 'Rapport Décaissements',                categorie: 'Budget & Finance',           description: "Analyse détaillée des décaissements par bailleur.",           formatsDisponibles: ['PDF', 'XLSX'],         auteur: 'Kadiatou Barry',   dateCreation: '2023-06-01', dateDernierExport: '2026-06-20', statut: 'Disponible', frequence: 'Mensuel',       favori: false, nombreExports: 31  },
  { id: 'rt10', code: 'RPT-LIV',  nom: 'Rapport Livrables',                    categorie: 'Planification & PTBA',       description: "Suivi de l'ensemble des livrables du projet.",                formatsDisponibles: ['XLSX'],                auteur: 'Aminata Cissé',    dateCreation: '2023-07-01', dateDernierExport: '2026-06-15', statut: 'Disponible', frequence: 'Mensuel',       favori: false, nombreExports: 22  },
  { id: 'rt11', code: 'RPT-RSK',  nom: 'Registre des Risques',                 categorie: 'Risques',                    description: "Registre complet des risques identifiés.",                    formatsDisponibles: ['PDF', 'XLSX'],         auteur: 'Ibrahim Maïga',    dateCreation: '2023-03-01', dateDernierExport: '2026-06-12', statut: 'Disponible', frequence: 'Mensuel',       favori: false, nombreExports: 28  },
  { id: 'rt12', code: 'RPT-EVM',  nom: 'Rapport EVM',                          categorie: 'EVM & Performance',          description: "Rapport de valeur acquise: PV, EV, AC, SPI, CPI, EAC.",      formatsDisponibles: ['PDF', 'XLSX', 'CSV'],  auteur: 'Amadou Diallo',    dateCreation: '2023-04-01', dateDernierExport: '2026-06-28', statut: 'Disponible', frequence: 'Mensuel',       favori: true,  nombreExports: 35  },
  { id: 'rt13', code: 'RPT-JNL',  nom: 'Journal des Opérations',               categorie: 'Ressources Humaines',        description: "Historique complet des opérations sur la plateforme.",        formatsDisponibles: ['PDF', 'CSV'],          auteur: 'Amadou Diallo',    dateCreation: '2023-02-01', dateDernierExport: '2026-06-26', statut: 'Disponible', frequence: 'Manuel',        favori: false, nombreExports: 19  },
  { id: 'rt14', code: 'RPT-USR',  nom: 'Rapport Utilisateurs',                 categorie: 'Ressources Humaines',        description: "État des comptes utilisateurs, rôles et activité.",           formatsDisponibles: ['XLSX', 'CSV'],         auteur: 'Fatoumata Koné',   dateCreation: '2023-09-01', dateDernierExport: '2026-06-05', statut: 'Disponible', frequence: 'Manuel',        favori: false, nombreExports: 8   },
];

export const mockGeneratedReports: GeneratedReport[] = [
  { id: 'g1',  reportCode: 'RPT-EVM',  reportNom: 'Rapport EVM',                      format: 'PDF',  dateGeneration: '2026-06-28 08:15', genereePar: 'Amadou Diallo',    taille: '1.2 Mo',  statut: 'Succès',   categorie: 'EVM & Performance'          },
  { id: 'g2',  reportCode: 'RPT-TDB',  reportNom: 'Tableau de Bord Portefeuille',      format: 'PDF',  dateGeneration: '2026-06-28 08:02', genereePar: 'Amadou Diallo',    taille: '3.4 Mo',  statut: 'Succès',   categorie: 'Synthèse & Tableau de bord' },
  { id: 'g3',  reportCode: 'RPT-BUD',  reportNom: "État d'Exécution Budgétaire",       format: 'XLSX', dateGeneration: '2026-06-27 16:30', genereePar: 'Moussa Traoré',    taille: '842 Ko',  statut: 'Succès',   categorie: 'Budget & Finance'           },
  { id: 'g4',  reportCode: 'RPT-CTR',  reportNom: 'Suivi des Contrats',                format: 'XLSX', dateGeneration: '2026-06-27 14:15', genereePar: 'Oumar Sanogo',     taille: '654 Ko',  statut: 'Succès',   categorie: 'Marchés & Contrats'         },
  { id: 'g5',  reportCode: 'RPT-FIN',  reportNom: 'Rapport Financier Mensuel',         format: 'PDF',  dateGeneration: '2026-06-25 09:45', genereePar: 'Fatoumata Koné',   taille: '2.1 Mo',  statut: 'Succès',   categorie: 'Budget & Finance'           },
  { id: 'g6',  reportCode: 'RPT-RSK',  reportNom: 'Registre des Risques',              format: 'PDF',  dateGeneration: '2026-06-24 11:00', genereePar: 'Ibrahim Maïga',    taille: '1.8 Mo',  statut: 'Succès',   categorie: 'Risques'                    },
  { id: 'g7',  reportCode: 'RPT-WBS',  reportNom: 'Avancement Activités WBS',          format: 'CSV',  dateGeneration: '2026-06-23 15:22', genereePar: 'Aminata Cissé',    taille: '128 Ko',  statut: 'Erreur',   categorie: 'Planification & PTBA'       },
  { id: 'g8',  reportCode: 'RPT-JNL',  reportNom: 'Journal des Opérations',            format: 'CSV',  dateGeneration: '2026-06-22 10:30', genereePar: 'Amadou Diallo',    taille: '89 Ko',   statut: 'Succès',   categorie: 'Ressources Humaines'        },
  { id: 'g9',  reportCode: 'RPT-DEC',  reportNom: 'Rapport Décaissements',             format: 'XLSX', dateGeneration: '2026-06-20 14:00', genereePar: 'Kadiatou Barry',   taille: '534 Ko',  statut: 'Succès',   categorie: 'Budget & Finance'           },
  { id: 'g10', reportCode: 'RPT-LIV',  reportNom: 'Rapport Livrables',                 format: 'XLSX', dateGeneration: '2026-06-19 09:15', genereePar: 'Aminata Cissé',    taille: '412 Ko',  statut: 'Succès',   categorie: 'Planification & PTBA'       },
  { id: 'g11', reportCode: 'RPT-CL',   reportNom: 'Rapport Cadre Logique',             format: 'PDF',  dateGeneration: '2026-06-15 16:45', genereePar: 'Aissatou Diop',    taille: '1.6 Mo',  statut: 'Succès',   categorie: 'Cadre Logique'              },
  { id: 'g12', reportCode: 'RPT-PTBA', reportNom: 'Rapport PTBA Trimestriel',          format: 'PDF',  dateGeneration: '2026-06-01 08:00', genereePar: 'Ibrahim Maïga',    taille: '4.2 Mo',  statut: 'Succès',   categorie: 'Planification & PTBA'       },
  { id: 'g13', reportCode: 'RPT-PPM',  reportNom: 'Plan de Passation des Marchés',     format: 'XLSX', dateGeneration: '2026-05-28 11:30', genereePar: 'Oumar Sanogo',     taille: '789 Ko',  statut: 'Succès',   categorie: 'Marchés & Contrats'         },
  { id: 'g14', reportCode: 'RPT-USR',  reportNom: 'Rapport Utilisateurs',              format: 'CSV',  dateGeneration: '2026-05-15 09:00', genereePar: 'Fatoumata Koné',   taille: '67 Ko',   statut: 'Succès',   categorie: 'Ressources Humaines'        },
  { id: 'g15', reportCode: 'RPT-EVM',  reportNom: 'Rapport EVM',                       format: 'XLSX', dateGeneration: '2026-05-10 14:20', genereePar: 'Amadou Diallo',    taille: '934 Ko',  statut: 'Succès',   categorie: 'EVM & Performance'          },
];

export const mockMonthlyExports: MonthlyExportsData[] = [
  { mois: 'Jul 25', exports: 4 },  { mois: 'Aoû 25', exports: 5 },
  { mois: 'Sep 25', exports: 8 },  { mois: 'Oct 25', exports: 9 },
  { mois: 'Nov 25', exports: 6 },  { mois: 'Déc 25', exports: 12 },
  { mois: 'Jan 26', exports: 10 }, { mois: 'Fév 26', exports: 7 },
  { mois: 'Mar 26', exports: 14 }, { mois: 'Avr 26', exports: 9 },
  { mois: 'Mai 26', exports: 8 },  { mois: 'Jun 26', exports: 11 },
];

export const mockReportsKPIs: ReportsKPIs = {
  totalTemplates: 14, generesParMois: 11, favoris: 4, planifies: 4,
};

export const ALL_CATEGORIES: ReportCategory[] = [
  'Synthèse & Tableau de bord', 'Budget & Finance', 'Planification & PTBA',
  'Cadre Logique', 'Marchés & Contrats', 'Risques', 'EVM & Performance',
  'Ressources Humaines', 'Portefeuille',
];

export const ALL_FORMATS: ReportFormat[] = ['PDF', 'XLSX', 'CSV', 'DOCX'];
