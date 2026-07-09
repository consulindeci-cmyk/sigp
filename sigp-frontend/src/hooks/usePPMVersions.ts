import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { PPMVersion, StatutPPM } from '@/types';
import { ppmKeys, fetchPpmMarcheList, type PpmMarcheDto } from './usePPM';

// Derive a document-level statut from the collection of marchés execution statuts
function deriveVersionStatut(dtos: PpmMarcheDto[]): StatutPPM {
  if (!dtos.length) return 'BROUILLON';
  if (dtos.every(d => d.statut === 'CLOTURE'))          return 'CLOTURE';
  if (dtos.some(d => d.statut === 'SIGNE'))             return 'APPROUVE';
  if (dtos.some(d => ['EVALUATION', 'ATTRIBUTION'].includes(d.statut))) return 'VALIDATION_BAILLEUR';
  if (dtos.some(d => ['LANCE', 'SOUMISSION'].includes(d.statut)))       return 'SOUMIS';
  return 'BROUILLON';
}

export function usePPMVersions(projectId: string) {
  const syntheticVersionId = `${projectId}-ppm-v1`;
  const [activeVersionId, setActiveVersionId] = useState<string>(syntheticVersionId);

  const query = useQuery({
    queryKey:  ppmKeys.list(projectId),
    queryFn:   () => fetchPpmMarcheList(projectId),
    enabled:   !!projectId,

  });

  const dtos: PpmMarcheDto[] = query.data ?? [];

  const versions: PPMVersion[] = useMemo(() => [
    {
      id:                       syntheticVersionId,
      projet_id:                projectId,
      numero_version:           'V1.0',
      statut:                   deriveVersionStatut(dtos),
      date_creation:            dtos[0]?.createdAt ?? new Date().toISOString(),
      cree_par:                 '',
      budget_version_reference: `${projectId}-budget`,
      lignes:                   [],
    },
  ], [syntheticVersionId, projectId, dtos]);

  return {
    versions,
    activeVersionId,
    setActiveVersionId,
    isLoading: query.isLoading,
  };
}
