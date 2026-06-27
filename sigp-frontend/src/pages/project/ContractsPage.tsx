import React, { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useUIStore } from '@/stores/uiStore';
import { useContracts } from '@/hooks/useContracts';
import { ContractDataTable } from '@/components/project/contracts/views/ContractDataTable';
import { FilterBar } from '@/components/ui/forms/FilterBar';
import { Select } from '@/components/ui/forms/Select';

// On n'importe aucun composant complexe (DataTable, Forms) dans cette étape de fondation.
// Seulement la structure de base.

export default function ContractsPage() {
  const { id: urlProjectId } = useParams();
  const { activeProjectId } = useUIStore();
  const resolvedProjectId = urlProjectId || activeProjectId || '';

  const { contracts, isLoading } = useContracts(resolvedProjectId);

  // Optimisation prévue : useMemo pour les futurs calculs financiers / agrégations
  const totalContracts = useMemo(() => contracts.length, [contracts]);

  if (!resolvedProjectId) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-canvas">
        <h2 className="text-xl font-bold text-navy-900 mb-2">Aucun projet sélectionné</h2>
        <p className="text-slate">Veuillez sélectionner un projet pour afficher la gestion des contrats.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-canvas">
      {/* HEADER DE LA PAGE CONTRATS */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 p-6 bg-surface border-b border-line">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-navy-900">Gestion des Contrats</h1>
          <p className="text-sm text-slate">Suivi de l'exécution physique et financière des marchés signés.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button className="px-4 py-2 text-sm font-medium text-white bg-navy-600 rounded-md hover:bg-navy-700 transition-colors">
            Nouveau Contrat
          </button>
        </div>
      </div>

      {/* KPI / RÉSUMÉ (Structure) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-6 border-b border-line-soft bg-surface">
        <div className="p-4 border border-line-soft rounded-lg bg-canvas">
          <div className="text-xs font-semibold text-slate uppercase tracking-wide mb-1">Total Contrats Actifs</div>
          <div className="text-2xl font-bold text-navy-900">{totalContracts}</div>
        </div>
        <div className="p-4 border border-line-soft rounded-lg bg-canvas">
          <div className="text-xs font-semibold text-slate uppercase tracking-wide mb-1">Montant Engagé</div>
          <div className="text-2xl font-bold text-navy-900 text-orange-600">---</div>
        </div>
        <div className="p-4 border border-line-soft rounded-lg bg-canvas">
          <div className="text-xs font-semibold text-slate uppercase tracking-wide mb-1">Taux d'Exécution</div>
          <div className="text-2xl font-bold text-navy-900 text-green-600">---</div>
        </div>
      </div>

      {/* ZONE DE CONTENU PRINCIPALE */}
      <div className="flex-1 overflow-auto flex flex-col p-6 bg-canvas">
        <div className="bg-surface border border-line rounded-lg flex flex-col flex-1 overflow-hidden shadow-sm">
          <FilterBar>
            <Select 
              className="w-48"
              options={[
                { label: 'Tous les Bailleurs', value: '' },
                { label: 'Bailleur 1', value: '1' }
              ]} 
            />
            <Select 
              className="w-48"
              options={[
                { label: 'Tous les Statuts', value: '' },
                { label: 'EN EXECUTION', value: 'EN_EXECUTION' },
                { label: 'SIGNE', value: 'SIGNE' }
              ]} 
            />
          </FilterBar>
          
          <div className="flex-1 overflow-auto p-4">
            {isLoading ? (
              <div className="flex items-center justify-center h-40">
                <span className="text-slate font-medium">Chargement des contrats...</span>
              </div>
            ) : contracts.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-center border-2 border-dashed border-line rounded-lg">
                <p className="text-slate font-medium">Aucun contrat trouvé pour ce projet.</p>
              </div>
            ) : (
              <ContractDataTable contracts={contracts} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
