// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

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

export type ReportFormat = 'PDF' | 'XLSX' | 'CSV' | 'DOCX';
export type ReportFrequency = 'Manuel' | 'Quotidien' | 'Hebdomadaire' | 'Mensuel' | 'Trimestriel';
export type ReportStatus = 'Disponible' | 'Archivé';
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

// ─────────────────────────────────────────────────────────────────────────────
// 14 Report templates
// ─────────────────────────────────────────────────────────────────────────────

export const mockReportTemplates: ReportTemplate[] = [
  {
    id: 'rt1', code: 'RPT-TDB',
    nom: 'Tableau de Bord Portefeuille',
    categorie: 'Synthèse & Tableau de bord',
    description: 'Vue synthétique de l\'ensemble du portefeuille : KPIs, avancement global, alertes et indicateurs de performance clés.',
    formatsDisponibles: ['PDF', 'XLSX'],
    auteur: 'Amadou Diallo', dateCreation: '2023-02-01', dateDernierExport: '2026-06-28',
    statut: 'Disponible', frequence: 'Mensuel', favori: true, nombreExports: 48,
  },
  {
    id: 'rt2', code: 'RPT-FIN',
    nom: 'Rapport Financier Mensuel',
    categorie: 'Budget & Finance',
    description: 'Synthèse de l\'exécution budgétaire, des engagements, des décaissements et des écarts par composante et bailleur.',
    formatsDisponibles: ['PDF', 'XLSX', 'CSV'],
    auteur: 'Fatoumata Koné', dateCreation: '2023-02-01', dateDernierExport: '2026-06-25',
    statut: 'Disponible', frequence: 'Mensuel', favori: true, nombreExports: 42,
  },
  {
    id: 'rt3', code: 'RPT-BUD',
    nom: 'État d\'Exécution Budgétaire',
    categorie: 'Budget & Finance',
    description: 'Détail ligne par ligne de l\'exécution budgétaire par activité : budget alloué, engagé, décaissé et solde disponible.',
    formatsDisponibles: ['XLSX', 'CSV'],
    auteur: 'Moussa Traoré', dateCreation: '2023-03-15', dateDernierExport: '2026-06-22',
    statut: 'Disponible', frequence: 'Hebdomadaire', favori: false, nombreExports: 156,
  },
  {
    id: 'rt4', code: 'RPT-PTBA',
    nom: 'Rapport PTBA Trimestriel',
    categorie: 'Planification & PTBA',
    description: 'Bilan d\'avancement du Plan de Travail et Budget Annuel : activités réalisées, en cours, en retard et taux d\'atteinte par composante.',
    formatsDisponibles: ['PDF', 'XLSX'],
    auteur: 'Ibrahim Maïga', dateCreation: '2023-04-01', dateDernierExport: '2026-06-01',
    statut: 'Disponible', frequence: 'Trimestriel', favori: true, nombreExports: 12,
  },
  {
    id: 'rt5', code: 'RPT-WBS',
    nom: 'Avancement Activités WBS',
    categorie: 'Planification & PTBA',
    description: 'Tableau de bord détaillé de la structure de découpage du travail : hiérarchie des tâches, ressources, dates et taux d\'avancement.',
    formatsDisponibles: ['XLSX', 'CSV'],
    auteur: 'Aminata Cissé', dateCreation: '2023-05-10', dateDernierExport: '2026-06-18',
    statut: 'Disponible', frequence: 'Manuel', favori: false, nombreExports: 24,
  },
  {
    id: 'rt6', code: 'RPT-CL',
    nom: 'Rapport Cadre Logique',
    categorie: 'Cadre Logique',
    description: 'Matrice du cadre logique avec les indicateurs de résultats, sources de vérification, hypothèses et niveau d\'atteinte à date.',
    formatsDisponibles: ['PDF', 'XLSX'],
    auteur: 'Aissatou Diop', dateCreation: '2023-06-01', dateDernierExport: '2026-05-30',
    statut: 'Disponible', frequence: 'Mensuel', favori: false, nombreExports: 18,
  },
  {
    id: 'rt7', code: 'RPT-PPM',
    nom: 'Plan de Passation des Marchés',
    categorie: 'Marchés & Contrats',
    description: 'État complet du PPM : marchés planifiés, lancés, attribués, en cours d\'exécution et réceptionnés avec les délais et écarts.',
    formatsDisponibles: ['PDF', 'XLSX'],
    auteur: 'Oumar Sanogo', dateCreation: '2023-04-20', dateDernierExport: '2026-06-10',
    statut: 'Disponible', frequence: 'Manuel', favori: false, nombreExports: 14,
  },
  {
    id: 'rt8', code: 'RPT-CTR',
    nom: 'Suivi des Contrats',
    categorie: 'Marchés & Contrats',
    description: 'Tableau de bord des contrats actifs : montants, avancements, paiements, pénalités et date de clôture prévue.',
    formatsDisponibles: ['XLSX', 'CSV'],
    auteur: 'Oumar Sanogo', dateCreation: '2023-05-15', dateDernierExport: '2026-06-27',
    statut: 'Disponible', frequence: 'Hebdomadaire', favori: false, nombreExports: 89,
  },
  {
    id: 'rt9', code: 'RPT-DEC',
    nom: 'Rapport Décaissements',
    categorie: 'Budget & Finance',
    description: 'Analyse détaillée des décaissements par bailleur, composante, période et comparaison avec les prévisions du plan de financement.',
    formatsDisponibles: ['PDF', 'XLSX'],
    auteur: 'Kadiatou Barry', dateCreation: '2023-06-01', dateDernierExport: '2026-06-20',
    statut: 'Disponible', frequence: 'Mensuel', favori: false, nombreExports: 31,
  },
  {
    id: 'rt10', code: 'RPT-LIV',
    nom: 'Rapport Livrables',
    categorie: 'Planification & PTBA',
    description: 'Suivi de l\'ensemble des livrables du projet : statut, responsable, date prévue vs. réelle, taux de validation et commentaires.',
    formatsDisponibles: ['XLSX'],
    auteur: 'Aminata Cissé', dateCreation: '2023-07-01', dateDernierExport: '2026-06-15',
    statut: 'Disponible', frequence: 'Mensuel', favori: false, nombreExports: 22,
  },
  {
    id: 'rt11', code: 'RPT-RSK',
    nom: 'Registre des Risques',
    categorie: 'Risques',
    description: 'Registre complet des risques identifiés : niveau, probabilité, impact, stratégie de mitigation et statut de traitement.',
    formatsDisponibles: ['PDF', 'XLSX'],
    auteur: 'Ibrahim Maïga', dateCreation: '2023-03-01', dateDernierExport: '2026-06-12',
    statut: 'Disponible', frequence: 'Mensuel', favori: false, nombreExports: 28,
  },
  {
    id: 'rt12', code: 'RPT-EVM',
    nom: 'Rapport EVM',
    categorie: 'EVM & Performance',
    description: 'Rapport de valeur acquise (Earned Value Management) : PV, EV, AC, SV, CV, SPI, CPI, EAC, TCPI et courbes S.',
    formatsDisponibles: ['PDF', 'XLSX', 'CSV'],
    auteur: 'Amadou Diallo', dateCreation: '2023-04-01', dateDernierExport: '2026-06-28',
    statut: 'Disponible', frequence: 'Mensuel', favori: true, nombreExports: 35,
  },
  {
    id: 'rt13', code: 'RPT-JNL',
    nom: 'Journal des Opérations',
    categorie: 'Ressources Humaines',
    description: 'Historique complet des opérations effectuées sur la plateforme : actions, modules, utilisateurs, résultats et horodatage.',
    formatsDisponibles: ['PDF', 'CSV'],
    auteur: 'Amadou Diallo', dateCreation: '2023-02-01', dateDernierExport: '2026-06-26',
    statut: 'Disponible', frequence: 'Manuel', favori: false, nombreExports: 19,
  },
  {
    id: 'rt14', code: 'RPT-USR',
    nom: 'Rapport Utilisateurs',
    categorie: 'Ressources Humaines',
    description: 'État des comptes utilisateurs : rôles, permissions, statuts, projets affectés, dernières connexions et activité sur la période.',
    formatsDisponibles: ['XLSX', 'CSV'],
    auteur: 'Fatoumata Koné', dateCreation: '2023-09-01', dateDernierExport: '2026-06-05',
    statut: 'Disponible', frequence: 'Manuel', favori: false, nombreExports: 8,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Generated reports history — 15 records
// ─────────────────────────────────────────────────────────────────────────────

export const mockGeneratedReports: GeneratedReport[] = [
  { id: 'g1',  reportCode: 'RPT-EVM',  reportNom: 'Rapport EVM',                      format: 'PDF',  dateGeneration: '2026-06-28 08:15', genereePar: 'Amadou Diallo',    taille: '1.2 Mo',  statut: 'Succès',   categorie: 'EVM & Performance' },
  { id: 'g2',  reportCode: 'RPT-TDB',  reportNom: 'Tableau de Bord Portefeuille',      format: 'PDF',  dateGeneration: '2026-06-28 08:02', genereePar: 'Amadou Diallo',    taille: '3.4 Mo',  statut: 'Succès',   categorie: 'Synthèse & Tableau de bord' },
  { id: 'g3',  reportCode: 'RPT-BUD',  reportNom: 'État d\'Exécution Budgétaire',      format: 'XLSX', dateGeneration: '2026-06-27 16:30', genereePar: 'Moussa Traoré',    taille: '842 Ko',  statut: 'Succès',   categorie: 'Budget & Finance' },
  { id: 'g4',  reportCode: 'RPT-CTR',  reportNom: 'Suivi des Contrats',                format: 'XLSX', dateGeneration: '2026-06-27 14:15', genereePar: 'Oumar Sanogo',     taille: '654 Ko',  statut: 'Succès',   categorie: 'Marchés & Contrats' },
  { id: 'g5',  reportCode: 'RPT-FIN',  reportNom: 'Rapport Financier Mensuel',         format: 'PDF',  dateGeneration: '2026-06-25 09:45', genereePar: 'Fatoumata Koné',   taille: '2.1 Mo',  statut: 'Succès',   categorie: 'Budget & Finance' },
  { id: 'g6',  reportCode: 'RPT-RSK',  reportNom: 'Registre des Risques',              format: 'PDF',  dateGeneration: '2026-06-24 11:00', genereePar: 'Ibrahim Maïga',    taille: '1.8 Mo',  statut: 'Succès',   categorie: 'Risques' },
  { id: 'g7',  reportCode: 'RPT-WBS',  reportNom: 'Avancement Activités WBS',          format: 'CSV',  dateGeneration: '2026-06-23 15:22', genereePar: 'Aminata Cissé',    taille: '128 Ko',  statut: 'Erreur',   categorie: 'Planification & PTBA' },
  { id: 'g8',  reportCode: 'RPT-JNL',  reportNom: 'Journal des Opérations',            format: 'CSV',  dateGeneration: '2026-06-22 10:30', genereePar: 'Amadou Diallo',    taille: '89 Ko',   statut: 'Succès',   categorie: 'Ressources Humaines' },
  { id: 'g9',  reportCode: 'RPT-DEC',  reportNom: 'Rapport Décaissements',             format: 'XLSX', dateGeneration: '2026-06-20 14:00', genereePar: 'Kadiatou Barry',   taille: '534 Ko',  statut: 'Succès',   categorie: 'Budget & Finance' },
  { id: 'g10', reportCode: 'RPT-LIV',  reportNom: 'Rapport Livrables',                 format: 'XLSX', dateGeneration: '2026-06-19 09:15', genereePar: 'Aminata Cissé',    taille: '412 Ko',  statut: 'Succès',   categorie: 'Planification & PTBA' },
  { id: 'g11', reportCode: 'RPT-CL',   reportNom: 'Rapport Cadre Logique',             format: 'PDF',  dateGeneration: '2026-06-15 16:45', genereePar: 'Aissatou Diop',    taille: '1.6 Mo',  statut: 'Succès',   categorie: 'Cadre Logique' },
  { id: 'g12', reportCode: 'RPT-PTBA', reportNom: 'Rapport PTBA Trimestriel',          format: 'PDF',  dateGeneration: '2026-06-01 08:00', genereePar: 'Ibrahim Maïga',    taille: '4.2 Mo',  statut: 'Succès',   categorie: 'Planification & PTBA' },
  { id: 'g13', reportCode: 'RPT-PPM',  reportNom: 'Plan de Passation des Marchés',     format: 'XLSX', dateGeneration: '2026-05-28 11:30', genereePar: 'Oumar Sanogo',     taille: '789 Ko',  statut: 'Succès',   categorie: 'Marchés & Contrats' },
  { id: 'g14', reportCode: 'RPT-USR',  reportNom: 'Rapport Utilisateurs',              format: 'CSV',  dateGeneration: '2026-05-15 09:00', genereePar: 'Fatoumata Koné',   taille: '67 Ko',   statut: 'Succès',   categorie: 'Ressources Humaines' },
  { id: 'g15', reportCode: 'RPT-EVM',  reportNom: 'Rapport EVM',                       format: 'XLSX', dateGeneration: '2026-05-10 14:20', genereePar: 'Amadou Diallo',    taille: '934 Ko',  statut: 'Succès',   categorie: 'EVM & Performance' },
];

// ─────────────────────────────────────────────────────────────────────────────
// Monthly exports chart data — 12 months
// ─────────────────────────────────────────────────────────────────────────────

export const mockMonthlyExports: MonthlyExportsData[] = [
  { mois: 'Jul 25', exports: 4 },
  { mois: 'Aoû 25', exports: 5 },
  { mois: 'Sep 25', exports: 8 },
  { mois: 'Oct 25', exports: 9 },
  { mois: 'Nov 25', exports: 6 },
  { mois: 'Déc 25', exports: 12 },
  { mois: 'Jan 26', exports: 10 },
  { mois: 'Fév 26', exports: 7 },
  { mois: 'Mar 26', exports: 14 },
  { mois: 'Avr 26', exports: 9 },
  { mois: 'Mai 26', exports: 8 },
  { mois: 'Jun 26', exports: 11 },
];

// ─────────────────────────────────────────────────────────────────────────────
// KPIs
// ─────────────────────────────────────────────────────────────────────────────

export const mockReportsKPIs: ReportsKPIs = {
  totalTemplates: 14,
  generesParMois: 11,
  favoris: 4,
  planifies: 4, // non-Manual frequency templates
};

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

export const ALL_CATEGORIES: ReportCategory[] = [
  'Synthèse & Tableau de bord',
  'Budget & Finance',
  'Planification & PTBA',
  'Cadre Logique',
  'Marchés & Contrats',
  'Risques',
  'EVM & Performance',
  'Ressources Humaines',
  'Portefeuille',
];

export const ALL_FORMATS: ReportFormat[] = ['PDF', 'XLSX', 'CSV', 'DOCX'];
