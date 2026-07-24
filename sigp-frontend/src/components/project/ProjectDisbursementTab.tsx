import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { flexRender, type ColumnDef } from '@tanstack/react-table';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { Wallet, TrendingUp, Plus, Eye, Edit, Trash2, Download, PiggyBank, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDataTable } from '@/components/ui/data-table/hooks/useDataTable';
import { DataTableToolbar } from '@/components/ui/data-table/DataTableToolbar';
import { DataTablePagination } from '@/components/ui/data-table/DataTablePagination';
import { DataTableEmpty } from '@/components/ui/data-table/DataTableEmpty';
import { Button } from '@/components/ui/forms/Button';
import { Input } from '@/components/ui/forms/Input';
import { Select } from '@/components/ui/forms/Select';
import { StatCard } from '@/components/ui/data-display/StatCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/data-display/Card';
import {
  Modal, ModalContent, ModalHeader, ModalTitle, ModalDescription,
  ModalFooter, ModalClose,
} from '@/components/ui/overlays/Modal';
import { useUIStore } from '@/stores/uiStore';
import { useAuthStore } from '@/stores/authStore';
import { useFundingSources } from '@/hooks/useFundingSources';
import { useContracts } from '@/hooks/useContracts';
import { useBudget, useBudgetVersion } from '@/hooks/useBudget';
import { useProject } from '@/hooks/useProjects';
import type { BudgetLigne } from '@/types/budget';
import type { Disbursement } from '@/types/disbursement';
import {
  useDisbursements, useCreateDisbursement, useUpdateDisbursement, useDeleteDisbursement,
} from '@/hooks/useDisbursements';

// ─────────────────────────────────────────────────────────────────────────────
// Référence automatique (DEC-001, DEC-002...) — même principe que le N° des
// Risques (RSQ-XXX) et la Référence des marchés PPM : calculée côté client à
// partir du plus grand numéro existant, affichée en lecture seule.
// ─────────────────────────────────────────────────────────────────────────────

function nextReference(records: Disbursement[]): string {
  const max = records.reduce((m, r) => {
    const n = parseInt((r.reference ?? '').replace('DEC-', ''), 10);
    return isNaN(n) ? m : Math.max(m, n);
  }, 0);
  return `DEC-${String(max + 1).padStart(3, '0')}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// CSV Export
// ─────────────────────────────────────────────────────────────────────────────

function exportCsv(records: Disbursement[], budgetLignes: BudgetLigne[]) {
  const HEADERS = ['Référence', 'Ligne Budgétaire', 'Montant', 'Devise', 'Date', 'Description'];
  const rows = records.map(r => [
    r.reference ?? '',
    budgetLignes.find(l => l.id === r.budgetLigneId)?.code_ligne ?? '',
    String(r.montant), r.devise, r.date ?? '', r.description ?? '',
  ]);
  const content = '﻿' + [HEADERS, ...rows]
    .map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(';'))
    .join('\n');
  const url = URL.createObjectURL(new Blob([content], { type: 'text/csv;charset=utf-8;' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = `decaissements-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const CHART_COLORS = {
  recu: 'hsl(var(--primary))',
};

const tooltipStyle = {
  backgroundColor: 'hsl(var(--card))',
  border: '1px solid hsl(var(--border))',
  borderRadius: '8px',
  color: 'hsl(var(--foreground))',
  fontSize: '12px',
};

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
    });
  } catch { return '—'; }
}

function formatMontant(value: number, devise?: string): string {
  const n = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(value);
  return devise ? `${n} ${devise}` : n;
}

// ─────────────────────────────────────────────────────────────────────────────
// Controlled form state
// ─────────────────────────────────────────────────────────────────────────────

interface DisbFormValues {
  budgetLigneId: string; montant: string; date: string; description: string;
}

type DisbFormErrors = Partial<Record<keyof DisbFormValues, string>>;

const EMPTY_FORM: DisbFormValues = {
  budgetLigneId: '', montant: '', date: '', description: '',
};

function recordToForm(r: Disbursement): DisbFormValues {
  return {
    budgetLigneId: r.budgetLigneId ?? '',
    montant: String(r.montant),
    date: r.date ?? '',
    description: r.description ?? '',
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Field row helper
// ─────────────────────────────────────────────────────────────────────────────

function FRow({
  id, label, error, full = false, children,
}: {
  id?: string; label: string; error?: string; full?: boolean; children: React.ReactNode;
}) {
  return (
    <div className={`flex flex-col gap-1.5${full ? ' sm:col-span-2' : ''}`}>
      <label className="text-sm font-medium text-foreground" htmlFor={id}>{label}</label>
      {children}
      {error && <p className="text-xs text-destructive" role="alert">{error}</p>}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Modal — Voir / Ajouter / Modifier
// ─────────────────────────────────────────────────────────────────────────────

type SlideOverMode = 'view' | 'edit' | 'new';

function DisbursementSlideOver({
  open, onOpenChange, record, mode, onSave,
  budgetLigneOptions, suggestedReference, projectDevise,
  isSaving, error,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  record: Disbursement | null;
  mode: SlideOverMode;
  onSave?: (data: Partial<Disbursement>) => void;
  budgetLigneOptions: BudgetLigne[];
  suggestedReference: string;
  projectDevise: string;
  isSaving?: boolean;
  error?: string | null;
}) {
  const [values, setValues] = useState<DisbFormValues>(EMPTY_FORM);
  const [errors, setErrors] = useState<DisbFormErrors>({});
  const readOnly = mode === 'view';
  // budget_ligne_id est fixé à la création côté serveur (disbursements-update
  // ne l'accepte pas) — désactivé en édition pour ne pas laisser croire
  // qu'un changement ici serait pris en compte.
  const isCreationOnlyFieldsLocked = mode === 'edit';

  useEffect(() => {
    if (!open) return;
    setErrors({});
    if (mode === 'new') setValues(EMPTY_FORM);
    else if (record) setValues(recordToForm(record));
  }, [open, mode, record?.id]);

  function set(k: keyof DisbFormValues, v: string) {
    setValues(prev => ({ ...prev, [k]: v }));
    if (errors[k]) setErrors(prev => ({ ...prev, [k]: undefined }));
  }

  const selectedLigne = budgetLigneOptions.find(l => l.id === values.budgetLigneId) ?? null;

  function validate(): boolean {
    const errs: DisbFormErrors = {};
    if (!values.montant || Number(values.montant) <= 0) errs.montant = 'Montant requis (> 0)';
    if (!values.budgetLigneId) errs.budgetLigneId = 'Ligne budgétaire requise';
    if (!values.date) errs.date = 'Date requise';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSave() {
    if (!validate()) return;
    onSave?.({
      budgetLigneId: values.budgetLigneId || null,
      budgetVersionId: selectedLigne?.budget_version_id || null,
      montant: Number(values.montant),
      devise: projectDevise,
      date: values.date || null,
      description: values.description.trim() || null,
    });
  }

  const titles: Record<SlideOverMode, string> = {
    view: 'Détails du décaissement', edit: 'Modifier le décaissement', new: 'Nouveau décaissement',
  };

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent className="max-w-2xl max-h-[90vh] flex flex-col p-0 gap-0">
        <ModalHeader className="px-6 py-4 border-b border-border shrink-0 space-y-1">
          <ModalTitle>{titles[mode]}</ModalTitle>
        </ModalHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {readOnly && record ? (
            <div className="flex flex-col gap-5">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Référence</p>
                <p className="font-mono text-[14px] font-semibold text-foreground">{record.reference || '—'}</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-border pt-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Ligne Budgétaire</p>
                  <p className="text-[13px] font-semibold text-foreground">
                    {budgetLigneOptions.find(l => l.id === record.budgetLigneId)?.code_ligne || '—'}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Date du décaissement</p>
                  <p className="font-mono text-[13px] text-foreground">{formatDate(record.date)}</p>
                </div>
                <div className="sm:col-span-2">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Description</p>
                  <p className="text-[13px] text-foreground">{record.description || '—'}</p>
                </div>
              </div>

              <div className="bg-muted/40 rounded-lg p-4 text-center">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Montant</p>
                <p className="font-mono text-[16px] font-bold text-foreground">{formatMontant(record.montant, record.devise)}</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FRow id="dis-ref" label="N°" full>
                <Input id="dis-ref" value={record?.reference ?? suggestedReference} disabled readOnly />
                <span className="text-[10px] text-muted-foreground">Généré automatiquement, non modifiable.</span>
              </FRow>

              <FRow id="dis-budget-ligne" label="Ligne Budgétaire" error={errors.budgetLigneId} full>
                <Select
                  id="dis-budget-ligne"
                  value={values.budgetLigneId}
                  onChange={e => set('budgetLigneId', e.target.value)}
                  disabled={isCreationOnlyFieldsLocked}
                >
                  <option value="">-- Sélectionner --</option>
                  {budgetLigneOptions.map(l => (
                    <option key={l.id} value={l.id}>{l.code_ligne} — {l.libelle}</option>
                  ))}
                </Select>
                {isCreationOnlyFieldsLocked && (
                  <span className="text-[10px] text-muted-foreground">Non modifiable après création.</span>
                )}
              </FRow>

              <FRow id="dis-montant" label={`Montant (${projectDevise})`} error={errors.montant}>
                <Input id="dis-montant" type="number" min={0} value={values.montant} onChange={e => set('montant', e.target.value)} placeholder="0" />
              </FRow>

              <FRow id="dis-date" label="Date du décaissement" error={errors.date}>
                <Input id="dis-date" type="date" value={values.date} onChange={e => set('date', e.target.value)} />
              </FRow>

              <FRow id="dis-desc" label="Description / Justification" full>
                <Input id="dis-desc" value={values.description} onChange={e => set('description', e.target.value)} placeholder="Objet du décaissement" />
              </FRow>
            </div>
          )}

          {!readOnly && selectedLigne && Number(values.montant) >= 0 && (() => {
            const montant = Number(values.montant) || 0;
            const solde = selectedLigne.solde_disponible;
            const depasse = montant > solde;
            return (
              <div className={`mt-4 p-3 rounded-md text-sm border flex items-center justify-between ${
                depasse ? 'bg-destructive/10 border-destructive/20 text-destructive' : 'bg-success/10 border-success/20 text-success'
              }`}>
                <span className="font-medium">Solde disponible (ligne budgétaire) :</span>
                <span className="font-mono font-bold">{formatMontant(solde, projectDevise)}</span>
              </div>
            );
          })()}

          {error && (
            <div className="mt-4 flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive" role="alert">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" aria-hidden="true" />
              <span>{error}</span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-border shrink-0">
          <ModalClose asChild>
            <Button variant="outline" type="button">{readOnly ? 'Fermer' : 'Annuler'}</Button>
          </ModalClose>
          {!readOnly && (
            <Button variant="default" onClick={handleSave} disabled={isSaving}>
              {isSaving ? 'Enregistrement...' : mode === 'edit' ? 'Enregistrer' : 'Ajouter'}
            </Button>
          )}
        </div>
      </ModalContent>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Registre — rendu "feuille de calcul Excel" (même approche que
// RiskRegistryTable.tsx : distinct du <DataTable> générique partagé par une
// vingtaine d'autres modules, pour ne pas en changer l'apparence partout.
// Réutilise le même moteur tanstack (useDataTable) et les mêmes sous-
// composants (toolbar, pagination, état vide), avec un rendu de <table>
// propre à cet écran : en-tête bg-primary, bordures nettes border-border,
// pas de troncature.
// ─────────────────────────────────────────────────────────────────────────────

const DISB_TH = 'px-3 py-2.5 text-[11px] font-bold uppercase tracking-wide text-primary-foreground border border-primary/70 whitespace-nowrap select-none';

function DisbursementRegistryTable({
  records, budgetLigneOptions, onView, onEdit, onDelete, canManage, canDelete,
}: {
  records: Disbursement[];
  budgetLigneOptions: BudgetLigne[];
  onView: (r: Disbursement) => void;
  onEdit: (r: Disbursement) => void;
  onDelete: (id: string) => void;
  canManage: boolean;
  canDelete: boolean;
}) {
  const columns = useMemo((): ColumnDef<Disbursement, unknown>[] => [
    {
      id: 'identification',
      accessorKey: 'reference',
      header: 'Référence',
      cell: ({ row }) => {
        const { reference, budgetLigneId, description } = row.original;
        const ligne = budgetLigneOptions.find(l => l.id === budgetLigneId);
        return (
          <div className="flex flex-col gap-0.5 px-3 py-2 whitespace-normal break-words">
            <span className="font-mono text-[12px] font-semibold text-foreground">{reference || '—'}</span>
            <span className="text-[13px] font-medium text-foreground">{ligne ? `${ligne.code_ligne} — ${ligne.libelle}` : '—'}</span>
            {description && <span className="text-[10px] text-muted-foreground">{description}</span>}
          </div>
        );
      },
    },
    {
      accessorKey: 'montant',
      header: 'Montant',
      cell: ({ row }) => (
        <span className="block px-3 py-2 text-right font-mono text-[12px] font-semibold text-success whitespace-nowrap">
          {formatMontant(row.original.montant, row.original.devise)}
        </span>
      ),
    },
    {
      accessorKey: 'date',
      header: 'Date',
      cell: ({ getValue }) => (
        <span className="block px-3 py-2 text-center font-mono text-[12px] text-muted-foreground whitespace-nowrap">
          {formatDate(getValue() as string | null)}
        </span>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex items-center gap-1 justify-center px-2 py-1.5">
          <Button variant="ghost" size="sm" aria-label="Voir les détails" onClick={() => onView(row.original)}><Eye className="h-3.5 w-3.5" /></Button>
          {canManage && (
            <Button variant="ghost" size="sm" aria-label="Modifier" onClick={() => onEdit(row.original)}><Edit className="h-3.5 w-3.5" /></Button>
          )}
          {canDelete && (
            <Button variant="ghost" size="sm" aria-label="Supprimer" className="text-destructive hover:text-destructive" onClick={() => onDelete(row.original.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
          )}
        </div>
      ),
    },
  ], [budgetLigneOptions, onView, onEdit, onDelete, canManage, canDelete]);

  const { table } = useDataTable({ data: records, columns });

  return (
    <div className="flex flex-col bg-background border border-border rounded-lg overflow-hidden min-w-0">
      <DataTableToolbar table={table} searchKey="reference" searchPlaceholder="Rechercher par référence..." />

      <div className="w-full overflow-x-auto overflow-y-hidden">
        {records.length === 0 || table.getRowModel().rows.length === 0 ? (
          <DataTableEmpty />
        ) : (
          <table className="w-full min-w-max border-collapse text-sm">
            <thead className="sticky top-0 z-20 bg-primary">
              {table.getHeaderGroups().map(headerGroup => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map(header => (
                    <th key={header.id} className={cn(DISB_TH, ['date', 'actions'].includes(header.column.id) && 'text-center', header.column.id === 'montant' && 'text-right')}>
                      {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>

            <tbody>
              {table.getRowModel().rows.map((row, rowIndex) => (
                <tr key={row.id} className={rowIndex % 2 === 0 ? 'bg-background' : 'bg-muted/30'}>
                  {row.getVisibleCells().map(cell => (
                    <td key={cell.id} className="border border-border align-middle p-0">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <DataTablePagination table={table} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main export
// ─────────────────────────────────────────────────────────────────────────────

export default function ProjectDisbursementTab() {
  const { id: urlProjectId } = useParams<{ id: string }>();
  const activeProjectId = useUIStore(s => s.activeProjectId);
  const projectId = urlProjectId || activeProjectId || '';

  // Sources de financement / Contrats retirés du formulaire (cf.
  // simplification), mais conservés en lecture ici : uniquement pour que les
  // décaissements créés AVANT ce changement (rattachés seulement à l'un de
  // ces deux, sans ligne budgétaire) restent visibles dans le registre.
  const { data: fundingSources = [] } = useFundingSources(projectId);
  const fundingSourceIds = useMemo(() => fundingSources.map(s => s.id), [fundingSources]);

  const { data: contracts = [] } = useContracts(projectId);
  const contractIds = useMemo(() => contracts.map(c => c.id), [contracts]);

  const { data: budget } = useBudget(projectId);
  const { data: budgetVersion } = useBudgetVersion(projectId, budget?.version_active_id);
  const budgetLignes = useMemo(() => budgetVersion?.lignes ?? [], [budgetVersion]);
  const budgetLigneIds = useMemo(() => budgetLignes.map(l => l.id), [budgetLignes]);

  const { data: project } = useProject(projectId);
  const projectDevise = project?.devise || 'XOF';

  const { data: records = [] } = useDisbursements(projectId, fundingSourceIds, budgetLigneIds, contractIds);
  const createMutation = useCreateDisbursement(projectId, fundingSourceIds, budgetLigneIds, contractIds);
  const updateMutation = useUpdateDisbursement(projectId, fundingSourceIds, budgetLigneIds, contractIds);
  const deleteMutation = useDeleteDisbursement(projectId, fundingSourceIds, budgetLigneIds, contractIds);

  // Miroir des rôles serveur (requireRole) sur disbursements-create/update
  // (COORDINATEUR/CHARGE_PROGRAMME/FINANCIER/ADMIN/SUPER_ADMIN) et -delete (ADMIN/SUPER_ADMIN).
  const currentRole = useAuthStore(s => s.user?.role);
  const canManage = !!currentRole && ['COORDINATEUR', 'CHARGE_PROGRAMME', 'FINANCIER', 'ADMIN', 'SUPER_ADMIN'].includes(currentRole);
  const canDelete = currentRole === 'ADMIN' || currentRole === 'SUPER_ADMIN';

  const [slideOverOpen, setSlideOverOpen]   = useState(false);
  const [slideOverMode, setSlideOverMode]   = useState<SlideOverMode>('new');
  const [selectedRecord, setSelectedRecord] = useState<Disbursement | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [deleteModalOpen,  setDeleteModalOpen]  = useState(false);
  const [recordToDelete,   setRecordToDelete]   = useState<string | null>(null);
  const [deleteError,      setDeleteError]      = useState<string | null>(null);

  function extractErrorMessage(err: unknown): string {
    return err instanceof Error ? err.message : 'Une erreur est survenue. Veuillez réessayer.';
  }

  function openView(r: Disbursement) { setSelectedRecord(r); setSlideOverMode('view'); setSlideOverOpen(true); }
  function openEdit(r: Disbursement) { setSelectedRecord(r); setSlideOverMode('edit'); setSaveError(null); setSlideOverOpen(true); }
  function openDeleteModal(id: string) { setRecordToDelete(id); setDeleteError(null); setDeleteModalOpen(true); }

  function handleDeleteConfirm() {
    if (!recordToDelete) return;
    setDeleteError(null);
    deleteMutation.mutate(recordToDelete, {
      onSuccess: () => { setDeleteModalOpen(false); setRecordToDelete(null); },
      onError: (err) => setDeleteError(extractErrorMessage(err)),
    });
  }

  // N° suggéré pour un nouveau décaissement — affiché en lecture seule dans
  // le formulaire (même principe que le N° des Risques et la Référence des
  // marchés PPM), calculé ici pour rester synchronisé avec la liste
  // réellement chargée. Attribué uniquement à la création, jamais recalculé
  // en édition (record.reference fait foi).
  const suggestedReference = useMemo(() => nextReference(records), [records]);

  function handleSave(data: Partial<Disbursement>) {
    setSaveError(null);
    const onError = (err: unknown) => setSaveError(extractErrorMessage(err));
    if (slideOverMode === 'new') {
      createMutation.mutate({ ...data, reference: suggestedReference }, { onSuccess: () => setSlideOverOpen(false), onError });
    } else if (selectedRecord) {
      updateMutation.mutate({ id: selectedRecord.id, ...data }, { onSuccess: () => setSlideOverOpen(false), onError });
    }
  }

  // Tout décaissement enregistré représente désormais un paiement déjà
  // effectué (plus de statut de workflow) — la somme couvre tous les
  // enregistrements chargés.
  const montantDecaisse = useMemo(() => records.reduce((s, r) => s + r.montant, 0), [records]);

  // Budget de référence pour le taux de décaissement : somme des lignes
  // budgétaires réelles (montant_revise) si elles existent, avec repli sur
  // l'enveloppe globale du projet (project.budgetTotal) — même logique que
  // le "taux de décaissement" déjà calculé côté portefeuille projets
  // (cf. useProjects.ts : bud.prevu > 0 ? bud.prevu : project.budgetTotal).
  const budgetTotalRef = useMemo(() => {
    const sommeLignes = budgetLignes.reduce((s, l) => s + (l.montant_revise ?? 0), 0);
    return sommeLignes > 0 ? sommeLignes : Number(project?.budgetTotal ?? 0);
  }, [budgetLignes, project?.budgetTotal]);

  const tauxDec = budgetTotalRef > 0 ? Math.round((montantDecaisse / budgetTotalRef) * 100) : 0;
  const resteADecaisser = budgetTotalRef - montantDecaisse;

  // Évolution mensuelle — montant décaissé par mois, dérivé de la date unique
  // du décaissement (plus de distinction prévu/réel).
  const chartData = useMemo(() => {
    const byMonth = new Map<string, number>();
    for (const r of records) {
      if (!r.date) continue;
      const month = r.date.slice(0, 7);
      byMonth.set(month, (byMonth.get(month) ?? 0) + r.montant);
    }
    return Array.from(byMonth.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([mois, montant]) => ({ mois, montant: Math.round(montant / 1_000_000 * 10) / 10 }));
  }, [records]);

  return (
    <section aria-label="Suivi des Décaissements" className="flex flex-col gap-6">

      {/* KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Total Décaissements"
          value={records.length}
          icon={<TrendingUp className="h-4 w-4 text-primary" aria-hidden="true" />}
          iconVariant="primary"
        />
        <StatCard
          title="Taux de décaissement"
          value={`${tauxDec}%`}
          icon={<Wallet className="h-4 w-4 text-success" aria-hidden="true" />}
          iconVariant="success"
          description="Décaissé / Budget total du projet"
        />
        <StatCard
          title="Reste à décaisser"
          value={formatMontant(resteADecaisser, projectDevise)}
          icon={<PiggyBank className={`h-4 w-4 ${resteADecaisser < 0 ? 'text-destructive' : 'text-info'}`} aria-hidden="true" />}
          iconVariant={resteADecaisser < 0 ? 'destructive' : 'info'}
          description="Budget total − Décaissé"
        />
      </div>

      {/* Évolution Chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Évolution mensuelle des décaissements (M)</CardTitle>
        </CardHeader>
        <CardContent>
          <div role="img" aria-label="Graphique évolution mensuelle des décaissements" className="h-[240px]">
            {chartData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-sm text-muted-foreground">Aucun décaissement enregistré</div>
            ) : (
              <ResponsiveContainer width="99%" height="100%">
                <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gradRecu" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor={CHART_COLORS.recu} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={CHART_COLORS.recu} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="mois" tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`${v}M`, undefined]} />
                  <Legend iconType="circle" iconSize={8} formatter={(v: string) => <span className="text-[11px] text-muted-foreground">{v}</span>} />
                  <Area type="monotone" dataKey="montant" name="Décaissé" stroke={CHART_COLORS.recu} fill="url(#gradRecu)" strokeWidth={2} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Registre */}
      <Card>
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-base">Registre des décaissements ({records.length})</CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" aria-label="Exporter CSV" onClick={() => exportCsv(records, budgetLignes)}>
              <Download className="h-4 w-4 mr-1.5" aria-hidden="true" />
              CSV
            </Button>
            {canManage && (
              <Button
                variant="default" size="sm" aria-label="Ajouter un décaissement"
                onClick={() => { setSelectedRecord(null); setSlideOverMode('new'); setSaveError(null); setSlideOverOpen(true); }}
              >
                <Plus className="h-4 w-4 mr-1.5" aria-hidden="true" />
                Ajouter
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <DisbursementRegistryTable
            records={records}
            budgetLigneOptions={budgetLignes}
            onView={openView}
            onEdit={openEdit}
            onDelete={openDeleteModal}
            canManage={canManage}
            canDelete={canDelete}
          />
        </CardContent>
      </Card>

      {/* ── Modal ────────────────────────────────────────────────────────── */}
      <DisbursementSlideOver
        open={slideOverOpen}
        onOpenChange={open => { setSlideOverOpen(open); if (!open) setSaveError(null); }}
        record={selectedRecord}
        mode={slideOverMode}
        onSave={handleSave}
        budgetLigneOptions={budgetLignes}
        suggestedReference={suggestedReference}
        projectDevise={projectDevise}
        isSaving={createMutation.isPending || updateMutation.isPending}
        error={saveError}
      />

      {/* ── Delete Confirmation Modal ──────────────────────────────────── */}
      <Modal open={deleteModalOpen} onOpenChange={open => { setDeleteModalOpen(open); if (!open) { setRecordToDelete(null); setDeleteError(null); } }}>
        <ModalContent>
          <ModalHeader>
            <ModalTitle>Confirmer la suppression</ModalTitle>
            <ModalDescription>
              Êtes-vous sûr de vouloir supprimer ce décaissement ? Cette action est irréversible.
            </ModalDescription>
          </ModalHeader>
          {deleteError && (
            <p className="px-6 pb-2 text-sm text-destructive flex items-center gap-1.5" role="alert">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              {deleteError}
            </p>
          )}
          <ModalFooter>
            <ModalClose asChild>
              <Button variant="outline">Annuler</Button>
            </ModalClose>
            <Button variant="destructive" onClick={handleDeleteConfirm} disabled={deleteMutation.isPending}>
              <Trash2 className="h-4 w-4 mr-1.5" aria-hidden="true" />
              {deleteMutation.isPending ? 'Suppression...' : 'Supprimer'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </section>
  );
}
