import { useState, useMemo, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useUIStore } from '@/stores/uiStore';
import { useAuthStore } from '@/stores/authStore';
import { DataTable } from '@/components/ui/data-table/DataTable';
import { StatCard } from '@/components/ui/data-display/StatCard';
import { Button } from '@/components/ui/forms/Button';
import { Plus, FileSignature, Banknote, CheckCircle2, Archive, Download } from 'lucide-react';
import { formatMoney } from '@/utils/format';
import { getContractColumns } from '@/components/project/contracts/views/contractColumns';
import { contractFilters } from '@/components/project/contracts/views/contractFilters';
import { ContractSlideOver } from '@/components/project/contracts/forms/ContractSlideOver';
import { useContracts, useCreateContract, useUpdateContract, useDeleteContract } from '@/hooks/useContracts';
import type { Contract } from '@/types/contract';
import * as XLSX from 'xlsx';

// ─────────────────────────────────────────────────────────────────────────────
// Export helpers
// ─────────────────────────────────────────────────────────────────────────────

const EXPORT_HEADERS = [
  'Référence', 'Intitulé', 'Statut', 'Bailleur', 'Titulaire',
  'WBS', 'Budget Ligne', 'PPM Ligne',
  'Devise', 'Montant Devise', 'Montant Base (XOF)', 'Taux Change',
  'Date Signature', 'Ordre de Service', 'Fin Prévue', 'Fin Réelle',
  'Réc. Provisoire', 'Réc. Définitive',
  'Garantie Exéc. (%)', 'Avance (%)', 'Retenue (%)',
];

function toRow(c: Contract): (string | number)[] {
  return [
    c.reference, c.intitule, c.statut, c.bailleur_id, c.fournisseur_id,
    c.wbs_id, c.budget_ligne_id, c.ppm_ligne_id,
    c.devise_code, c.montant_initial_devise, c.montant_initial_base, c.taux_change_contractuel,
    c.date_signature ?? '', c.date_ordre_service ?? '', c.fin_prevue ?? '', c.fin_reelle ?? '',
    c.reception_provisoire ?? '', c.reception_definitive ?? '',
    c.garantie_bonne_execution_taux ?? '', c.garantie_avance_taux ?? '', c.retenue_garantie_taux ?? '',
  ];
}

function exportCsv(contracts: Contract[]) {
  const content = '﻿' + [EXPORT_HEADERS, ...contracts.map(toRow)]
    .map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(';'))
    .join('\n');
  const url = URL.createObjectURL(new Blob([content], { type: 'text/csv;charset=utf-8;' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = `contrats-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function exportXlsx(contracts: Contract[]) {
  const ws = XLSX.utils.aoa_to_sheet([EXPORT_HEADERS, ...contracts.map(toRow)]);
  ws['!cols'] = [
    { wch: 18 }, { wch: 40 }, { wch: 14 }, { wch: 16 }, { wch: 20 },
    { wch: 12 }, { wch: 12 }, { wch: 12 },
    { wch: 8 }, { wch: 18 }, { wch: 18 }, { wch: 10 },
    { wch: 14 }, { wch: 14 }, { wch: 12 }, { wch: 12 },
    { wch: 14 }, { wch: 14 },
    { wch: 14 }, { wch: 10 }, { wch: 12 },
  ];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Contrats');
  XLSX.writeFile(wb, `contrats-${new Date().toISOString().slice(0, 10)}.xlsx`);
}

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────

export default function ContractsPage() {
  const { id: urlProjectId } = useParams();
  const { activeProjectId } = useUIStore();
  const resolvedProjectId = urlProjectId || activeProjectId || '';

  const { data: contractsData, isLoading: isLoadingContracts } = useContracts(resolvedProjectId);
  const createMutation = useCreateContract(resolvedProjectId);
  const updateMutation = useUpdateContract(resolvedProjectId);
  const deleteMutation = useDeleteContract(resolvedProjectId);

  const contracts = useMemo(() => contractsData ?? [], [contractsData]);

  // Miroir des rôles serveur (requireRole) sur contracts-create/update
  // (COORDINATEUR/CHARGE_PROGRAMME/ADMIN/SUPER_ADMIN) et -delete (ADMIN/SUPER_ADMIN).
  const currentRole = useAuthStore(s => s.user?.role);
  const canManage = !!currentRole && ['COORDINATEUR', 'CHARGE_PROGRAMME', 'ADMIN', 'SUPER_ADMIN'].includes(currentRole);
  const canDelete = currentRole === 'ADMIN' || currentRole === 'SUPER_ADMIN';

  const [slideOpen, setSlideOpen] = useState(false);
  const [slideMode, setSlideMode] = useState<'view' | 'edit' | 'new'>('view');
  const [selected, setSelected] = useState<Contract | null>(null);

  const handleNew = () => {
    setSelected(null);
    setSlideMode('new');
    setSlideOpen(true);
  };

  const handleView = useCallback((contract: Contract) => {
    setSelected(contract);
    setSlideMode('view');
    setSlideOpen(true);
  }, []);

  const handleEdit = useCallback((contract: Contract) => {
    setSelected(contract);
    setSlideMode('edit');
    setSlideOpen(true);
  }, []);

  // Persistance réelle : la modale (ContractSlideOver) attend la résolution de
  // ces promesses avant de se fermer et affiche l'erreur elle-même en cas
  // d'échec — plus d'état local optimiste ni de fire-and-forget ici.
  const handleSave = async (data: Omit<Contract, 'id' | 'version_hash' | 'projet_id'>) => {
    if (slideMode === 'new') {
      await createMutation.mutateAsync(data);
    } else if (selected) {
      await updateMutation.mutateAsync({ id: selected.id, data });
    }
  };

  const handleDelete = async (id: string) => {
    await deleteMutation.mutateAsync(id);
  };

  const kpis = useMemo(() => {
    let montantEngage = 0;
    let enExecution = 0;
    let termines = 0;

    contracts.forEach(c => {
      if (!['BROUILLON', 'RESILIE', 'SUSPENDU'].includes(c.statut))
        montantEngage += c.montant_initial_base || 0;
      if (c.statut === 'EN_EXECUTION') enExecution++;
      if (c.statut === 'TERMINE' || c.statut === 'CLOTURE') termines++;
    });

    return { total: contracts.length, montantEngage, enExecution, termines };
  }, [contracts]);

  const columns = useMemo(
    () => getContractColumns({ onEdit: handleEdit, onView: handleView, canManage }),
    [handleEdit, handleView, canManage]
  );

  if (!resolvedProjectId) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center bg-background rounded-lg border border-border">
        <h2 className="text-base font-bold text-foreground mb-2">Aucun projet sélectionné</h2>
        <p className="text-sm text-muted-foreground">Veuillez sélectionner un projet pour afficher la gestion des contrats.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">

      {/* ── HEADER ──────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-border">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Gestion des Contrats</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Suivi de l'exécution physique et financière des marchés signés.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" leftIcon={<Download className="h-3.5 w-3.5" />} className="h-8 text-xs" onClick={() => exportXlsx(contracts)}>
            Excel
          </Button>
          <Button variant="ghost" size="sm" leftIcon={<Download className="h-3.5 w-3.5" />} className="h-8 text-xs" onClick={() => exportCsv(contracts)}>
            CSV
          </Button>
          {canManage && (
            <Button variant="default" size="sm" leftIcon={<Plus className="h-3.5 w-3.5" />} className="h-8 text-xs" onClick={handleNew}>
              Nouveau Contrat
            </Button>
          )}
        </div>
      </div>

      {/* ── KPI STRIP ───────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard
          title="Total Contrats"
          value={kpis.total}
          icon={<FileSignature className="h-4 w-4" />}
          iconVariant="primary"
          description="marchés enregistrés"
        />
        <StatCard
          title="Montant Engagé (XOF)"
          value={formatMoney(kpis.montantEngage)}
          icon={<Banknote className="h-4 w-4" />}
          iconVariant="warning"
          description="hors brouillons / résiliés"
        />
        <StatCard
          title="En Exécution"
          value={kpis.enExecution}
          icon={<CheckCircle2 className="h-4 w-4" />}
          iconVariant="success"
          description="contrats actifs"
        />
        <StatCard
          title="Terminés / Clôturés"
          value={kpis.termines}
          icon={<Archive className="h-4 w-4" />}
          iconVariant="info"
          description="marchés soldés"
        />
      </div>

      {/* ── TABLE ───────────────────────────────────────────────────────────── */}
      <DataTable
        columns={columns}
        data={contracts}
        isLoading={isLoadingContracts}
        isError={false}
        searchKey="identification"
        searchPlaceholder="Rechercher (Réf, Objet, Titulaire)..."
        filters={contractFilters}
        enableRowSelection={true}
        onRowClick={handleView}
      />

      {/* ── SLIDEOVER ───────────────────────────────────────────────────────── */}
      <ContractSlideOver
        open={slideOpen}
        onClose={() => setSlideOpen(false)}
        mode={slideMode}
        contract={selected}
        onSave={handleSave}
        onDelete={handleDelete}
        onSwitchToEdit={() => setSlideMode('edit')}
        projectId={resolvedProjectId}
        canManage={canManage}
        canDelete={canDelete}
      />
    </div>
  );
}
