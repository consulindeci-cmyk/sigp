import { useState, useEffect, useMemo } from 'react';
import { PPMLigne } from '@/types';
import { budgetValidationService } from '@/services/budgetValidationService';

// Mock data for PPM lines
let mockPPMLignes: PPMLigne[] = [
  {
    id: 'ppm-l1',
    ppm_version_id: 'ppm-v1.0',
    wbs_id: 'wbs-1-1',
    budget_ligne_id: 'bl-1',
    bailleur_id: 'b-ida',
    reference_marche: 'AOI-001/2026',
    description: 'Construction du siège',
    categorie: 'TRAVAUX',
    methode: 'AOI',
    type_revue: 'PRIOR',
    montant_estime_devise: 5000000,
    devise_code: 'USD',
    taux_change_estime: 600,
    montant_estime_base: 3000000000, // 3 Milliards XOF
    est_lot_unique: true,
    dates_cles: {
      preparation_dao_prevue: '2026-03-01',
      lancement_dao_prevue: '2026-04-01',
      remise_offres_prevue: '2026-05-15',
      ouverture_evaluation_prevue: '2026-05-20',
      attribution_prevue: '2026-06-30',
      signature_contrat_prevue: '2026-07-15',
      demarrage_prevue: '2026-08-01',
    },
    statut: 'DAO_EN_PREPARATION',
    version_hash: 'hash-1'
  },
  {
    id: 'ppm-l2',
    ppm_version_id: 'ppm-v1.0',
    wbs_id: 'wbs-1-2',
    budget_ligne_id: 'bl-2',
    bailleur_id: 'b-afd',
    reference_marche: 'QCBS-002/2026',
    description: 'Services de consultant pour supervision',
    categorie: 'SERVICES_CONSULTANTS',
    methode: 'QCBS',
    type_revue: 'POST',
    montant_estime_devise: 150000000,
    devise_code: 'XOF',
    taux_change_estime: 1,
    montant_estime_base: 150000000,
    est_lot_unique: true,
    dates_cles: {
      preparation_dao_prevue: '2026-01-10',
      lancement_dao_prevue: '2026-02-01',
      remise_offres_prevue: '2026-03-01',
      ouverture_evaluation_prevue: '2026-03-10',
      attribution_prevue: '2026-04-15',
      signature_contrat_prevue: '2026-05-01',
      demarrage_prevue: '2026-05-15',
    },
    statut: 'CONTRAT_SIGNE',
    version_hash: 'hash-2'
  }
];

export function usePPM(versionId?: string) {
  const [lignes, setLignes] = useState<PPMLigne[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Recharge les lignes
  const fetchLignes = () => {
    setIsLoading(true);
    // Simule réseau
    setTimeout(() => {
      const filtered = mockPPMLignes.filter(l => l.ppm_version_id === versionId);
      setLignes(filtered);
      setIsLoading(false);
    }, 400);
  };

  useEffect(() => {
    fetchLignes();
  }, [versionId]);

  // Mutations
  const addLigne = async (nouvelleLigne: Omit<PPMLigne, 'id' | 'version_hash' | 'statut' | 'ppm_version_id'>) => {
    if (!versionId) throw new Error("Aucune version PPM active");

    // Appel du service de validation budgétaire commun
    const validation = await budgetValidationService.checkBudgetAvailability(
      nouvelleLigne.budget_ligne_id, 
      nouvelleLigne.montant_estime_base
    );
    if (!validation.isAvailable) {
      throw new Error(validation.message);
    }

    const ligne: PPMLigne = {
      ...nouvelleLigne,
      id: `ppm-l${Date.now()}`,
      ppm_version_id: versionId,
      statut: 'PLANIFIE',
      version_hash: `hash-${Date.now()}`
    };

    mockPPMLignes = [...mockPPMLignes, ligne];
    fetchLignes();
    return ligne;
  };

  const updateLigne = async (id: string, updates: Partial<PPMLigne>) => {
    const ligneExistante = mockPPMLignes.find(l => l.id === id);
    if (!ligneExistante) throw new Error("Ligne introuvable");

    // Si on modifie le montant ou la ligne budgétaire, revalider
    const newBudgetLigneId = updates.budget_ligne_id || ligneExistante.budget_ligne_id;
    const newMontantBase = updates.montant_estime_base !== undefined ? updates.montant_estime_base : ligneExistante.montant_estime_base;

    // TODO: En réalité, vérifier seulement le delta si c'est la même ligne budgétaire
    // mais pour cette étape on vérifie le montant total demandé vs. solde disponible
    const validation = await budgetValidationService.checkBudgetAvailability(newBudgetLigneId, newMontantBase);
    
    if (!validation.isAvailable) {
      throw new Error(validation.message);
    }

    mockPPMLignes = mockPPMLignes.map(l => 
      l.id === id 
        ? { ...l, ...updates, version_hash: `hash-${Date.now()}` }
        : l
    );
    fetchLignes();
  };

  const deleteLigne = async (id: string) => {
    mockPPMLignes = mockPPMLignes.filter(l => l.id !== id);
    fetchLignes();
  };

  // Calculs mémorisés
  const totalEstimeBase = useMemo(() => {
    return lignes.reduce((acc, ligne) => acc + ligne.montant_estime_base, 0);
  }, [lignes]);

  return {
    lignes,
    isLoading,
    totalEstimeBase,
    addLigne,
    updateLigne,
    deleteLigne
  };
}
