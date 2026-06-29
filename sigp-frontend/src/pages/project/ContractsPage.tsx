import { PageHeader } from '@/components/layout/PageHeader';
import { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useUIStore } from '@/stores/uiStore';
import { useContracts } from '@/hooks/useContracts';
import { DataTable } from '@/components/ui/data-table/DataTable';
import { StatCard } from '@/components/ui/data-display/StatCard';
import { Button } from '@/components/ui/forms/Button';
import { Plus, FileSignature, DollarSign, Activity } from 'lucide-react';
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
  const { totalContracts, montantEngage, tauxExecution } = useMemo(() => {
    let engage = 0;
    contracts.forEach(c => {
      if (c.statut !== 'BROUILLON' && c.statut !== 'RESILIE' && c.statut !== 'SUSPENDU') {
        engage += c.montant_initial_base || 0;
      }
    });

    return {
      totalContracts: contracts.length,
      montantEngage: engage,
      tauxExecution: contracts.length > 0 ? 'N/A' : '0%',
    };
  }, [contracts]);

  if (!resolvedProjectId) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-background rounded-lg border border-border">
        <h2 className="text-base font-bold text-foreground mb-2">Aucun projet sélectionné</h2>
        <p className="text-sm text-muted-foreground">Veuillez sélectionner un projet pour afficher la gestion des contrats.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden bg-background">

      {/* ── HEADER ──────────────────────────────────────────────────────────── */}
      <div className="shrink-0 flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b border-border bg-card">
        <div>
          <PageHeader title="Gestion des Contrats" description="Suivi de l'exécution physique et financière des marchés signés." />
        </div>
        <Button variant="default" size="sm" leftIcon={<Plus className="h-3.5 w-3.5" />} className="h-8 text-xs">
          Nouveau Contrat
        </Button>
      </div>

      {/* ── KPI STRIP ───────────────────────────────────────────────────────── */}
      <div className="shrink-0 grid grid-cols-1 sm:grid-cols-3 gap-3 px-4 py-3 border-b border-border bg-muted/10">
        <StatCard
          title="Total Contrats"
          value={totalContracts}
          icon={<FileSignature className="h-4 w-4" />}
          iconVariant="primary"
          description="marchés enregistrés"
        />
        <StatCard
          title="Montant Engagé (XOF)"
          value={formatMoney(montantEngage)}
          icon={<DollarSign className="h-4 w-4" />}
          iconVariant="warning"
          description="hors brouillons / résiliés"
        />
        <StatCard
          title="Taux d'Exécution Global"
          value={tauxExecution}
          icon={<Activity className="h-4 w-4" />}
          iconVariant="success"
          description="basé sur les décaissements"
        />
      </div>

      {/* ── TABLE ───────────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-auto p-4">
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
    </div>
  );
}
