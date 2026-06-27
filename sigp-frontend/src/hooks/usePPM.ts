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
  },
  {
    id: 'ppm-l3',
    ppm_version_id: 'ppm-v1.1',
    wbs_id: 'wbs-2-1',
    budget_ligne_id: 'bl-1',
    bailleur_id: 'b-ida',
    reference_marche: 'AON-001/2026-R1',
    description: 'Réhabilitation Routes Rurales – Lot 1',
    categorie: 'TRAVAUX',
    methode: 'AON',
    type_revue: 'PRIOR',
    montant_estime_devise: 1200000,
    devise_code: 'USD',
    taux_change_estime: 600,
    montant_estime_base: 720000000,
    est_lot_unique: true,
    dates_cles: {
      preparation_dao_prevue: '2026-07-01',
      lancement_dao_prevue: '2026-08-01',
      remise_offres_prevue: '2026-09-15',
      ouverture_evaluation_prevue: '2026-09-20',
      attribution_prevue: '2026-10-30',
      signature_contrat_prevue: '2026-11-15',
      demarrage_prevue: '2026-12-01',
    },
    statut: 'PLANIFIE',
    version_hash: 'hash-3'
  },
  {
    id: 'ppm-l4',
    ppm_version_id: 'ppm-v1.1',
    wbs_id: 'wbs-2-2',
    budget_ligne_id: 'bl-2',
    bailleur_id: 'b-afd',
    reference_marche: 'CF-002/2026-R1',
    description: 'Fourniture de matériel informatique bureaux régionaux',
    categorie: 'BIENS',
    methode: 'CF',
    type_revue: 'POST',
    montant_estime_devise: 45000000,
    devise_code: 'XOF',
    taux_change_estime: 1,
    montant_estime_base: 45000000,
    est_lot_unique: true,
    dates_cles: {
      preparation_dao_prevue: '2026-07-15',
      lancement_dao_prevue: '2026-08-10',
      remise_offres_prevue: '2026-09-05',
      ouverture_evaluation_prevue: '2026-09-08',
      attribution_prevue: '2026-09-30',
      signature_contrat_prevue: '2026-10-15',
      demarrage_prevue: '2026-11-01',
    },
    statut: 'DAO_EN_PREPARATION',
    version_hash: 'hash-4'
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

  // Calculs mémorisés — métriques globales
  const totalEstimeBase = useMemo(() => {
    return lignes.reduce((acc, ligne) => acc + ligne.montant_estime_base, 0);
  }, [lignes]);

  // Métriques analytiques pour le Dashboard BI (Étape 5)
  // Aucune logique métier nouvelle — uniquement des agrégations sur les lignes existantes.
  const biMetrics = useMemo(() => {
    if (lignes.length === 0) return null;

    // 1. Répartition par Catégorie d'achat
    const parCategorie = lignes.reduce<Record<string, { count: number; montant: number }>>((acc, l) => {
      if (!acc[l.categorie]) acc[l.categorie] = { count: 0, montant: 0 };
      acc[l.categorie].count += 1;
      acc[l.categorie].montant += l.montant_estime_base;
      return acc;
    }, {});

    const categorieData = Object.entries(parCategorie).map(([name, v]) => ({
      name: name.replace('_', ' '),
      count: v.count,
      montant: v.montant,
    }));

    // 2. Répartition par Méthode de passation
    const parMethode = lignes.reduce<Record<string, number>>((acc, l) => {
      acc[l.methode] = (acc[l.methode] || 0) + l.montant_estime_base;
      return acc;
    }, {});

    const methodeData = Object.entries(parMethode).map(([name, value]) => ({ name, value }));

    // 3. Répartition par Statut
    const parStatut = lignes.reduce<Record<string, number>>((acc, l) => {
      const label = l.statut.replace(/_/g, ' ');
      acc[label] = (acc[label] || 0) + 1;
      return acc;
    }, {});

    const statutData = Object.entries(parStatut).map(([name, value]) => ({ name, value }));

    // 4. Distribution Revue Prior vs Post (montant)
    const revueData = [
      { name: 'PRIOR (ANO)', value: lignes.filter(l => l.type_revue === 'PRIOR').reduce((s, l) => s + l.montant_estime_base, 0) },
      { name: 'POST', value: lignes.filter(l => l.type_revue === 'POST').reduce((s, l) => s + l.montant_estime_base, 0) },
    ];

    // 5. KPI globaux
    const nbSigmes = lignes.filter(l => l.statut === 'CONTRAT_SIGNE').length;
    const nbEnCours = lignes.filter(l => !['PLANIFIE', 'CONTRAT_SIGNE', 'CLOTURE', 'ANNULE'].includes(l.statut)).length;
    const montantSigne = lignes.filter(l => l.statut === 'CONTRAT_SIGNE').reduce((s, l) => s + l.montant_estime_base, 0);
    const pctPrior = lignes.length > 0 ? Math.round((lignes.filter(l => l.type_revue === 'PRIOR').length / lignes.length) * 100) : 0;

    return {
      categorieData,
      methodeData,
      statutData,
      revueData,
      kpi: {
        totalLignes: lignes.length,
        nbSigmes,
        nbEnCours,
        montantSigne,
        pctPrior,
      },
    };
  }, [lignes]);

  return {
    lignes,
    isLoading,
    totalEstimeBase,
    biMetrics,
    addLigne,
    updateLigne,
    deleteLigne
  };
}
