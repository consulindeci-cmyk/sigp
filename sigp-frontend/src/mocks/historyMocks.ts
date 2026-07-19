import type { TypeActionHistorique, NiveauHistorique, ModuleHistorique } from '@/types';

// ─── Listes normalisées ───────────────────────────────────────────────────────
// Utilisées par TabHistory.tsx (filtres) et HistorySlideOver.tsx (libellés) —
// seule partie de ce fichier réellement importée ailleurs. Les 150 événements
// de démonstration et les types HistoryModule/HistoryEntry qui vivaient ici
// (MOCK_HISTORIQUE, mockHistoryEntries) n'étaient importés nulle part —
// supprimés.

export const MODULES_HISTORIQUE: ModuleHistorique[] = [
  'Projet', 'PTBA', 'Activités', 'Budget', 'Sources', 'PPM',
  'Contrats', 'Décaissements', 'EVM', 'Risques', 'Livrables',
  'Documents', 'Rapports', 'Paramètres',
];

export const ACTION_LABEL: Record<TypeActionHistorique, string> = {
  CREATION:      'Création',
  MODIFICATION:  'Modification',
  SUPPRESSION:   'Suppression',
  VALIDATION:    'Validation',
  REJET:         'Rejet',
  CONNEXION:     'Connexion',
  DECONNEXION:   'Déconnexion',
  TELECHARGEMENT:'Téléchargement',
  IMPORT:        'Import',
  EXPORT:        'Export',
  ARCHIVAGE:     'Archivage',
  RESTAURATION:  'Restauration',
};

export const ACTION_OPTIONS: { value: TypeActionHistorique; label: string }[] = [
  { value: 'CREATION',       label: 'Création'       },
  { value: 'MODIFICATION',   label: 'Modification'   },
  { value: 'SUPPRESSION',    label: 'Suppression'    },
  { value: 'VALIDATION',     label: 'Validation'     },
  { value: 'REJET',          label: 'Rejet'          },
  { value: 'CONNEXION',      label: 'Connexion'      },
  { value: 'DECONNEXION',    label: 'Déconnexion'    },
  { value: 'TELECHARGEMENT', label: 'Téléchargement' },
  { value: 'IMPORT',         label: 'Import'         },
  { value: 'EXPORT',         label: 'Export'         },
  { value: 'ARCHIVAGE',      label: 'Archivage'      },
  { value: 'RESTAURATION',   label: 'Restauration'   },
];

export const NIVEAU_OPTIONS: { value: NiveauHistorique; label: string }[] = [
  { value: 'INFO',         label: 'Info'         },
  { value: 'AVERTISSEMENT',label: 'Avertissement'},
  { value: 'CRITIQUE',     label: 'Critique'     },
];
