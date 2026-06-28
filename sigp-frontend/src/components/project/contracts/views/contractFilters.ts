import { DataTableFilter } from '@/components/ui/data-table/types';

export const contractFilters: DataTableFilter[] = [
  {
    id: 'statut',
    title: 'Statut',
    options: [
      { label: 'Tous', value: '' },
      { label: 'En Exécution', value: 'EN_EXECUTION' },
      { label: 'Signé', value: 'SIGNE' },
      { label: 'Brouillon', value: 'BROUILLON' },
      { label: 'Suspendu', value: 'SUSPENDU' },
      { label: 'Résilié', value: 'RESILIE' },
      { label: 'Terminé', value: 'TERMINE' },
      { label: 'Clôturé', value: 'CLOTURE' },
    ],
  },
  // Future filters can be added here
];
