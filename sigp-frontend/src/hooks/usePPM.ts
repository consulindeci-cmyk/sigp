import { useState, useEffect, useMemo } from 'react';
import { mockPPMLignes } from '@/mocks/ppmMock';
import { budgetValidationService } from '@/services/budgetValidationService';
import type { PPMLigne } from '@/types';

let localPPMLignes: PPMLigne[] = [...mockPPMLignes];

export function usePPM(versionId?: string) {
  const [lignes, setLignes] = useState<PPMLigne[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchLignes = () => {
    setIsLoading(true);
    setTimeout(() => {
      const filtered = localPPMLignes.filter(l => l.ppm_version_id === versionId);
      setLignes(filtered);
      setIsLoading(false);
    }, 400);
  };

  useEffect(() => {
    fetchLignes();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [versionId]);

  const addLigne = async (
    nouvelleLigne: Omit<PPMLigne, 'id' | 'version_hash' | 'statut' | 'ppm_version_id'>
  ) => {
    if (!versionId) throw new Error('Aucune version PPM active');

    const validation = await budgetValidationService.checkBudgetAvailability(
      nouvelleLigne.budget_ligne_id,
      nouvelleLigne.montant_estime_base
    );
    if (!validation.isAvailable) throw new Error(validation.message);

    const ligne: PPMLigne = {
      ...nouvelleLigne,
      id: `ppm-l${Date.now()}`,
      ppm_version_id: versionId,
      statut: 'PLANIFIE',
      version_hash: `hash-${Date.now()}`,
    };

    localPPMLignes = [...localPPMLignes, ligne];
    fetchLignes();
    return ligne;
  };

  const updateLigne = async (id: string, updates: Partial<PPMLigne>) => {
    const existing = localPPMLignes.find(l => l.id === id);
    if (!existing) throw new Error('Ligne introuvable');

    const newBudgetLigneId = updates.budget_ligne_id ?? existing.budget_ligne_id;
    const newMontant =
      updates.montant_estime_base !== undefined ? updates.montant_estime_base : existing.montant_estime_base;

    const validation = await budgetValidationService.checkBudgetAvailability(newBudgetLigneId, newMontant);
    if (!validation.isAvailable) throw new Error(validation.message);

    localPPMLignes = localPPMLignes.map(l =>
      l.id === id ? { ...l, ...updates, version_hash: `hash-${Date.now()}` } : l
    );
    fetchLignes();
  };

  const deleteLigne = async (id: string) => {
    localPPMLignes = localPPMLignes.filter(l => l.id !== id);
    fetchLignes();
  };

  const totalEstimeBase = useMemo(
    () => lignes.reduce((acc, l) => acc + l.montant_estime_base, 0),
    [lignes]
  );

  return {
    lignes,
    isLoading,
    totalEstimeBase,
    addLigne,
    updateLigne,
    deleteLigne,
  };
}
