import { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useUIStore } from '@/stores/uiStore';
import { useContracts } from '@/hooks/useContracts';
import { DataTable } from '@/components/ui/data-table/DataTable';
import { Button } from '@/components/ui/forms/Button';
import { Plus } from 'lucide-react';
import { formatMoney } from '@/utils/format';
import { getContractColumns } from '@/components/project/contracts/views/contractColumns';
import { contractFilters } from '@/components/project/contracts/views/contractFilters';
import type { Contract } from '@/types/contract';

export default function ContractsPage() {
  const { id: urlProjectId } = useParams();
  const { activeProjectId } = useUIStore();
  const resolvedProjectId = urlProjectId || activeProjectId || '';

  const { data: contracts = [], isLoading, error } = useContracts(resolvedProjectId);

  const handleEdit = (_contract: Contract) => {};
  const handleView = (_contract: Contract) => {};

  const columns = useMemo(() => getContractColumns({ onEdit: handleEdit, onView: handleView }), []);

  // ── KPI Calculations ───────────────────────────────────────────────────
  const { totalContracts, montantEngage } = useMemo(() => {
    let engage = 0;
    contracts.forEach(c => {
      if (c.statut !== 'BROUILLON' && c.statut !== 'RESILIE' && c.statut !== 'SUSPENDU') {
        engage += c.montant_initial_base || 0;
      }
    });

    return {
      totalContracts: contracts.length,
      montantEngage: engage,
    };
  }, [contracts]);

  if (!resolvedProjectId) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-background rounded-lg border border-border">
        <h2 className="text-xl font-bold text-foreground mb-2">Aucun projet sélectionné</h2>
        <p className="text-muted-foreground">Veuillez sélectionner un projet pour afficher la gestion des contrats.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 h-full">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Gestion des Contrats</h1>
          <p className="text-sm text-muted-foreground mt-1">Suivi de l'exécution physique et financière des marchés signés.</p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <Button variant="default" leftIcon={<Plus className="h-4 w-4" />}>
            Nouveau Contrat
          </Button>
        </div>
      </div>

      {/* KPI CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-background rounded-lg border border-border p-5 shadow-sm">
          <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Total Contrats</div>
          <div className="text-3xl font-semibold text-foreground">{totalContracts}</div>
        </div>
        <div className="bg-background rounded-lg border border-border p-5 shadow-sm">
          <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Montant Engagé (XOF)</div>
          <div className="text-3xl font-semibold text-warning">{formatMoney(montantEngage)}</div>
        </div>
        <div className="bg-background rounded-lg border border-border p-5 shadow-sm">
          <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Taux d'Exécution Global</div>
          <div className="text-3xl font-semibold text-success">
            {totalContracts > 0 ? 'N/A' : '0%'}
          </div>
        </div>
      </div>

      {/* MOTEUR DATATABLE (Golden Standard) */}
      <DataTable
        columns={columns}
        data={contracts}
        isLoading={isLoading}
        isError={!!error}
        errorMessage={error instanceof Error ? error.message : "Erreur de chargement des contrats"}
        searchKey="identification"
        searchPlaceholder="Rechercher (Réf, Objet, Titulaire)..."
        filters={contractFilters}
        enableRowSelection={true}
        onRowClick={handleView}
      />
    </div>
  );
}
