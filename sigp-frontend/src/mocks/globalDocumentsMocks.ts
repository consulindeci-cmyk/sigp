import type { CategorieGlobalDoc, StatutGlobalDoc, ConfidentialiteGlobalDoc, TypeFichier } from '@/types';

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

export const SERVICES_GLOBAL_DOC = [
  'Direction Générale', 'Service Financier', 'Service Technique',
  'Service Juridique', 'Service RH', 'Service IT', 'Service Communication',
];

