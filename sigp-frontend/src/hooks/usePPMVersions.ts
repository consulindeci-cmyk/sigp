import { useState, useEffect } from 'react';
import { mockPPMVersions } from '@/mocks/ppmMock';
import type { PPMVersion } from '@/types';

export function usePPMVersions() {
  const [versions, setVersions] = useState<PPMVersion[]>([]);
  const [activeVersionId, setActiveVersionId] = useState<string>('ppm-v1.0');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVersions(mockPPMVersions);
      setIsLoading(false);
    }, 600);
    return () => clearTimeout(timer);
  }, []);

  return {
    versions,
    activeVersionId,
    setActiveVersionId,
    isLoading,
  };
}
