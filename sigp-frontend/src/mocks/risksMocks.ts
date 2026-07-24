import type { RisqueCategorie, StatutRisque } from '@/types';

export const RISK_CATEGORIES: RisqueCategorie[] = [
  'Technique', 'Financier', 'Opérationnel', 'Juridique',
  'Environnemental', 'Social', 'Sécurité', 'Institutionnel', 'Gouvernance',
  'Politique', 'Ressources Humaines',
];

export const STATUT_RISQUE_OPTIONS: { value: StatutRisque; label: string }[] = [
  { value: 'OUVERT',    label: 'Ouvert'    },
  { value: 'EN_COURS',  label: 'En cours'  },
  { value: 'MAÎTRISÉ',  label: 'Maîtrisé'  },
  { value: 'CLOS',      label: 'Clos'      },
];
