import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { useUIStore } from '@/stores/uiStore';
import api from '@/lib/axios';
import type { PPMVersion } from '@/types';

export function usePPMVersions() {
  const { id: urlProjectId } = useParams<{ id: string }>();
  const { activeProjectId } = useUIStore();
  const resolvedProjectId = urlProjectId || activeProjectId || '';

  const [activeVersionId, setActiveVersionId] = useState<string>('');

  const query = useQuery({
    queryKey: ['ppm-versions', resolvedProjectId],
    queryFn: async (): Promise<PPMVersion[]> => {
      const { data } = await api.get<PPMVersion[]>(`/projects/${resolvedProjectId}/ppm/versions`);
      return data;
    },
    enabled: !!resolvedProjectId,
  });

  useEffect(() => {
    if (query.data && query.data.length > 0 && !activeVersionId) {
      const approved = query.data.find((v) => v.statut === 'APPROUVE');
      setActiveVersionId(approved?.id ?? query.data[0].id);
    }
  }, [query.data, activeVersionId]);

  return {
    versions: query.data ?? [],
    activeVersionId,
    setActiveVersionId,
    isLoading: query.isLoading,
  };
}
