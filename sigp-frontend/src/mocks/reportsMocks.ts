import type { TypeRapport, StatutRapport, FormatRapport } from '@/types';

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

// ─── (Anciennement : 22 rapports mock générés via un helper r() — supprimés,
// useReports.ts + la table réelle rapports_projet remplacent tout ça) ───────

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
  documentId?: string | null;
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

// ─── (Anciennement : mockReportTemplates/mockGeneratedReports/mockMonthlyExports/
// mockReportsKPIs — supprimés, non utilisés : ReportsPage.tsx construit déjà
// ses templates depuis les vraies données via buildTemplates()) ─────────────

export const ALL_CATEGORIES: ReportCategory[] = [
  'Synthèse & Tableau de bord', 'Budget & Finance', 'Planification & PTBA',
  'Cadre Logique', 'Marchés & Contrats', 'Risques', 'EVM & Performance',
  'Ressources Humaines', 'Portefeuille',
];

export const ALL_FORMATS: ReportFormat[] = ['PDF', 'XLSX', 'CSV', 'DOCX'];
