import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { PTBA, StatutPTBA } from '@/types';

// Mock data enrichi (Master Architecture)
const mockPTBA: PTBA = {
  id: 'ptba-2026-1-1',
  projet_id: 'proj-1',
  annee: 2026,
  statut: 'BROUILLON',
  version_majeure: 1,
  version_mineure: 1,
  nom_version: 'PTBA 2026 v1.1',
  cree_par: 'Jean Dupont',
  date_creation: '2026-06-20T10:00:00Z',
  budget_total: 150000000,
  lignes: [
    {
      id: 'l1',
      ptba_id: 'ptba-2026-1-1',
      wbs_id: 'wbs-1-1',
      activite_nom: 'Construction Bâtiment A',
      
      // Organisation & Finance
      responsable_id: 'resp-1',
      zone_geographique_id: 'zone-nord',
      bailleur_id: 'banque-mondiale',
      devise: 'XOF',
      taux_change_ref: 1,
      
      // Marchés
      is_procurement: true,
      type_marche: 'TRAVAUX',
      
      // Calcul Budgétaire
      quantite: 1,
      unite_mesure: 'Forfait',
      cout_unitaire: 50000000,
      montant_total: 50000000,
      
      // Mensuel
      m1_montant: 3000000, m2_montant: 3000000, m3_montant: 4000000,
      m4_montant: 6000000, m5_montant: 7000000, m6_montant: 7000000,
      m7_montant: 5000000, m8_montant: 5000000, m9_montant: 5000000,
      m10_montant: 2000000, m11_montant: 2000000, m12_montant: 1000000,
      
      // Trimestriel (Calculé)
      q1_montant: 10000000, q2_montant: 20000000, q3_montant: 15000000, q4_montant: 5000000,
      
      // Physique
      cibles_physiques: 'Fondations et murs du RDC terminés',
      m1_cible: false, m2_cible: false, m3_cible: true,
      m4_cible: false, m5_cible: false, m6_cible: true,
      m7_cible: false, m8_cible: false, m9_cible: true,
      m10_cible: false, m11_cible: false, m12_cible: true,
      
      // Suivi
      montant_engage: 5000000,
      montant_decaisse: 2000000,
      progression_physique: 15
    }
  ],
  historique_workflow: [
    {
      id: 'wf-1',
      ptba_id: 'ptba-2026-1-1',
      action: 'CREATION',
      statut_precedent: 'BROUILLON',
      nouveau_statut: 'BROUILLON',
      user_id: 'user-1',
      date_action: '2026-06-20T10:00:00Z'
    }
  ]
};

export function usePTBA(projectId: string, annee: number) {
  return useQuery({
    queryKey: ['ptba', projectId, annee],
    queryFn: async () => {
      await new Promise(resolve => setTimeout(resolve, 500));
      return { data: mockPTBA };
    },
    enabled: !!projectId && !!annee,
  });
}

export function useWorkflowPTBA(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ ptbaId, nouveauStatut, commentaire }: { ptbaId: string, nouveauStatut: StatutPTBA, commentaire?: string }) => {
      await new Promise(resolve => setTimeout(resolve, 500));
      console.log(`Transition de statut pour ${ptbaId} vers ${nouveauStatut}. Comm: ${commentaire || 'Aucun'}`);
      return { success: true };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ptba', projectId] });
    },
  });
}
