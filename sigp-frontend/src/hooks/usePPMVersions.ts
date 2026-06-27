import { useState, useEffect } from 'react';
import { PPMVersion } from '@/types';

// Mock data for PPM versions
const mockVersions: PPMVersion[] = [
  {
    id: 'ppm-v1.0',
    projet_id: 'proj-1',
    numero_version: 'V1.0',
    statut: 'APPROUVE',
    date_creation: '2026-01-15T10:00:00Z',
    date_approbation: '2026-02-01T14:30:00Z',
    cree_par: 'Jean Dupont',
    approuve_par: 'Banque Mondiale',
    budget_version_reference: 'budg-v1.0',
    lignes: [] // Ignored in version list usually
  },
  {
    id: 'ppm-v1.1',
    projet_id: 'proj-1',
    numero_version: 'V1.1',
    statut: 'BROUILLON',
    date_creation: '2026-06-10T09:15:00Z',
    cree_par: 'Marie Curie',
    budget_version_reference: 'budg-v1.1',
    lignes: []
  }
];

export function usePPMVersions() {
  const [versions, setVersions] = useState<PPMVersion[]>([]);
  const [activeVersionId, setActiveVersionId] = useState<string>('ppm-v1.0');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVersions(mockVersions);
      setIsLoading(false);
    }, 600);
    return () => clearTimeout(timer);
  }, []);

  return {
    versions,
    activeVersionId,
    setActiveVersionId,
    isLoading
  };
}
