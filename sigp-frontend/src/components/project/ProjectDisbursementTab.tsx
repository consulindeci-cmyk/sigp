import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { ColumnDef } from '@tanstack/react-table';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { Wallet, TrendingUp, Clock, AlertTriangle, AlertCircle, Plus, Eye, Edit, Trash2, Download } from 'lucide-react';
import { DataTable } from '@/components/ui/data-table/DataTable';
import { Badge } from '@/components/ui/data-display/Badge';
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
import type { Contract } from '@/types/contract';
import type { BudgetLigne } from '@/types/budget';
import {
  useDisbursements, useCreateDisbursement, useUpdateDisbursement, useDeleteDisbursement,
  type Disbursement, type DisbursementStatut,
} from '@/hooks/useDisbursements';

// ─────────────────────────────────────────────────────────────────────────────
// CSV Export
// ─────────────────────────────────────────────────────────────────────────────

function exportCsv(records: Disbursement[]) {
  const HEADERS = ['Référence', 'Source', 'Statut', 'Montant', 'Date prévue', 'Date réelle', 'Description'];
  const rows = records.map(r => [
    r.reference ?? '', r.fundingSourceNom ?? '', STATUT_LABELS[r.statut], String(r.montant),
    r.datePrevue ?? '', r.dateReelle ?? '', r.description ?? '',
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

const STATUT_LABELS: Record<DisbursementStatut, string> = {
  PLANIFIE: 'Planifié', DEMANDE: 'Demandé', APPROUVE: 'Approuvé', DECAISSE: 'Décaissé', REJETE: 'Rejeté',
};

const CHART_COLORS = {
  prevu: 'hsl(var(--muted-foreground))',
  recu:  'hsl(var(--primary))',
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

function formatMontant(value: number): string {
  return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(value);
}

function statutVariant(statut: DisbursementStatut): 'success' | 'warning' | 'secondary' | 'destructive' {
  switch (statut) {
    case 'DECAISSE': return 'success';
    case 'DEMANDE':
    case 'APPROUVE': return 'warning';
    case 'REJETE':   return 'destructive';
    default:         return 'secondary';
  }
}

function isLate(r: Disbursement): boolean {
  if (r.statut === 'DECAISSE' || r.statut === 'REJETE' || !r.datePrevue) return false;
  return new Date(r.datePrevue) < new Date();
}

// ─────────────────────────────────────────────────────────────────────────────
// Controlled form state
// ─────────────────────────────────────────────────────────────────────────────

interface DisbFormValues {
  fundingSourceId: string; budgetLigneId: string; contractId: string;
  statut: string; montant: string;
  datePrevue: string; dateReelle: string; reference: string; description: string;
}

type DisbFormErrors = Partial<Record<keyof DisbFormValues, string>>;

const EMPTY_FORM: DisbFormValues = {
  fundingSourceId: '', budgetLigneId: '', contractId: '', statut: 'PLANIFIE', montant: '',
  datePrevue: '', dateReelle: '', reference: '', description: '',
};

function recordToForm(r: Disbursement): DisbFormValues {
  return {
    fundingSourceId: r.fundingSourceId ?? '',
    budgetLigneId: r.budgetLigneId ?? '',
    contractId: r.contractId ?? '',
    statut: r.statut,
    montant: String(r.montant),
    datePrevue: r.datePrevue ?? '',
    dateReelle: r.dateReelle ?? '',
    reference: r.reference ?? '',
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
  fundingSourceOptions, contractOptions, budgetLigneOptions, allDisbursements,
  canSetDecaisse, isSaving, error,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  record: Disbursement | null;
  mode: SlideOverMode;
  onSave?: (data: Partial<Disbursement>) => void;
  fundingSourceOptions: { id: string; nom: string }[];
  contractOptions: Contract[];
  budgetLigneOptions: BudgetLigne[];
  allDisbursements: Disbursement[];
  canSetDecaisse: boolean;
  isSaving?: boolean;
  error?: string | null;
}) {
  const [values, setValues] = useState<DisbFormValues>(EMPTY_FORM);
  const [errors, setErrors] = useState<DisbFormErrors>({});
  const readOnly = mode === 'view';
  // budget_ligne_id/funding_source_id sont fixés à la création côté serveur
  // (disbursements-update ne les accepte pas) — désactivés en édition pour
  // ne pas laisser croire qu'un changement ici serait pris en compte.
  const isCreationOnlyFieldsLocked = mode === 'edit';

  useEffect(() => {
    if (!open) return;
    setErrors({});
    if (mode === 'new') setValues(EMPTY_FORM);
    else if (record) setValues(recordToForm(record));
  }, [open, mode, record?.id]);

  function set(k: keyof DisbFormValues, v: string) {
    setValues(prev => {
      // Un décaissement marqué Décaissé sans date réelle est une incohérence
      // de saisie (l'acte de paiement a forcément une date) — auto-remplie
      // avec aujourd'hui si absente, reste modifiable ensuite.
      const next = { ...prev, [k]: v };
      if (k === 'statut' && v === 'DECAISSE' && !prev.dateReelle) {
        next.dateReelle = new Date().toISOString().slice(0, 10);
      }
      return next;
    });
    if (errors[k]) setErrors(prev => ({ ...prev, [k]: undefined }));
  }

  const selectedLigne = budgetLigneOptions.find(l => l.id === values.budgetLigneId) ?? null;
  const selectedContrat = contractOptions.find(c => c.id === values.contractId) ?? null;

  // Reste à liquider du contrat = montant contractuel − somme des décaissements
  // déjà DECAISSE sur ce même contrat (hors le présent enregistrement, en édition).
  const contratDejaDecaisse = useMemo(() => {
    if (!selectedContrat) return 0;
    return allDisbursements
      .filter(d => d.contractId === selectedContrat.id && d.statut === 'DECAISSE' && d.id !== record?.id)
      .reduce((s, d) => s + d.montant, 0);
  }, [allDisbursements, selectedContrat, record?.id]);

  function validate(): boolean {
    const errs: DisbFormErrors = {};
    if (!values.montant || Number(values.montant) <= 0) errs.montant = 'Montant requis (> 0)';
    if (!values.fundingSourceId && !values.budgetLigneId && !values.contractId) {
      errs.fundingSourceId = 'Requis si aucune ligne budgétaire ou contrat n\'est sélectionné';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSave() {
    if (!validate()) return;
    onSave?.({
      fundingSourceId: values.fundingSourceId || null,
      budgetLigneId: values.budgetLigneId || null,
      contractId: values.contractId || null,
      budgetVersionId: selectedLigne?.budget_version_id || null,
      statut: values.statut as DisbursementStatut,
      montant: Number(values.montant),
      datePrevue: values.datePrevue || null,
      dateReelle: values.dateReelle || null,
      reference: values.reference.trim() || null,
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
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Référence</p>
                  <p className="font-mono text-[14px] font-semibold text-foreground">{record.reference || '—'}</p>
                </div>
                <Badge variant={statutVariant(record.statut)} className="text-[12px]">{STATUT_LABELS[record.statut]}</Badge>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-border pt-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Source de financement</p>
                  <p className="text-[13px] font-semibold text-foreground">{record.fundingSourceNom || '—'}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Ligne Budgétaire</p>
                  <p className="text-[13px] font-semibold text-foreground">
                    {budgetLigneOptions.find(l => l.id === record.budgetLigneId)?.code_ligne || '—'}
                  </p>
                </div>
                <div className="sm:col-span-2">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Contrat</p>
                  <p className="text-[13px] font-semibold text-foreground">
                    {contractOptions.find(c => c.id === record.contractId)?.reference || '—'}
                  </p>
                </div>
                <div className="sm:col-span-2">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Description</p>
                  <p className="text-[13px] text-foreground">{record.description || '—'}</p>
                </div>
              </div>

              <div className="bg-muted/40 rounded-lg p-4 text-center">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Montant</p>
                <p className="font-mono text-[16px] font-bold text-foreground">{formatMontant(record.montant)}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t border-border pt-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Date prévue</p>
                  <p className="font-mono text-[13px] text-foreground">{formatDate(record.datePrevue)}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Date réelle</p>
                  <p className="font-mono text-[13px] text-foreground">{formatDate(record.dateReelle)}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FRow id="dis-source" label="Source de financement" error={errors.fundingSourceId}>
                <Select
                  id="dis-source"
                  value={values.fundingSourceId}
                  onChange={e => set('fundingSourceId', e.target.value)}
                  disabled={isCreationOnlyFieldsLocked}
                >
                  <option value="">Aucune</option>
                  {fundingSourceOptions.map(fs => <option key={fs.id} value={fs.id}>{fs.nom}</option>)}
                </Select>
                {isCreationOnlyFieldsLocked && (
                  <span className="text-[10px] text-muted-foreground">Non modifiable après création.</span>
                )}
              </FRow>

              <FRow id="dis-budget-ligne" label="Ligne Budgétaire">
                <Select
                  id="dis-budget-ligne"
                  value={values.budgetLigneId}
                  onChange={e => set('budgetLigneId', e.target.value)}
                  disabled={isCreationOnlyFieldsLocked}
                >
                  <option value="">Aucune</option>
                  {budgetLigneOptions.map(l => (
                    <option key={l.id} value={l.id}>{l.code_ligne} — {l.libelle}</option>
                  ))}
                </Select>
                {isCreationOnlyFieldsLocked && (
                  <span className="text-[10px] text-muted-foreground">Non modifiable après création.</span>
                )}
              </FRow>

              <FRow id="dis-contrat" label="Contrat" full>
                <Select id="dis-contrat" value={values.contractId} onChange={e => set('contractId', e.target.value)}>
                  <option value="">Aucun</option>
                  {contractOptions.map(c => (
                    <option key={c.id} value={c.id}>{c.reference} — {c.intitule}</option>
                  ))}
                </Select>
              </FRow>

              <FRow id="dis-ref" label="Référence">
                <Input id="dis-ref" value={values.reference} onChange={e => set('reference', e.target.value)} placeholder="DEC-XXX-XXXX" />
              </FRow>

              <FRow id="dis-statut" label="Statut">
                <Select id="dis-statut" value={values.statut} onChange={e => set('statut', e.target.value)}>
                  {Object.entries(STATUT_LABELS)
                    .filter(([value]) => value !== 'DECAISSE' || canSetDecaisse || values.statut === 'DECAISSE')
                    .map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </Select>
                {!canSetDecaisse && (
                  <span className="text-[10px] text-muted-foreground">
                    Seul un rôle Financier peut marquer un décaissement comme Décaissé.
                  </span>
                )}
              </FRow>

              <FRow id="dis-montant" label="Montant" error={errors.montant}>
                <Input id="dis-montant" type="number" min={0} value={values.montant} onChange={e => set('montant', e.target.value)} placeholder="0" />
              </FRow>

              <FRow id="dis-datep" label="Date prévue">
                <Input id="dis-datep" type="date" value={values.datePrevue} onChange={e => set('datePrevue', e.target.value)} />
              </FRow>

              <FRow id="dis-dater" label="Date réelle">
                <Input id="dis-dater" type="date" value={values.dateReelle} onChange={e => set('dateReelle', e.target.value)} />
              </FRow>

              <FRow id="dis-desc" label="Description" full>
                <Input id="dis-desc" value={values.description} onChange={e => set('description', e.target.value)} placeholder="Objet du décaissement" />
              </FRow>
            </div>
          )}

          {!readOnly && (selectedLigne || selectedContrat) && Number(values.montant) >= 0 && (() => {
            const montant = Number(values.montant) || 0;
            const solde = selectedLigne
              ? selectedLigne.solde_disponible
              : Math.max(0, (selectedContrat?.montant_initial_base ?? 0) - contratDejaDecaisse);
            const label = selectedLigne ? 'Solde disponible (ligne budgétaire)' : 'Reste à liquider (contrat)';
            const depasse = montant > solde;
            return (
              <div className={`mt-4 p-3 rounded-md text-sm border flex items-center justify-between ${
                depasse ? 'bg-destructive/10 border-destructive/20 text-destructive' : 'bg-success/10 border-success/20 text-success'
              }`}>
                <span className="font-medium">{label} :</span>
                <span className="font-mono font-bold">{formatMontant(solde)}</span>
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
// Column definitions
// ─────────────────────────────────────────────────────────────────────────────

function buildDisbursementColumns(
  onView:     (r: Disbursement) => void,
  onEdit:     (r: Disbursement) => void,
  onDelete:   (id: string) => void,
  canManage:  boolean,
  canDelete:  boolean,
): ColumnDef<Disbursement, unknown>[] {
  return [
    {
      id: 'identification',
      accessorKey: 'reference',
      header: 'Référence & Source',
      meta: { isSticky: true } as Record<string, unknown>,
      cell: ({ row }) => {
        const { reference, fundingSourceNom, description } = row.original;
        return (
          <div className="flex flex-col gap-0.5 min-w-[200px] max-w-[280px]">
            <span className="font-mono text-[12px] font-semibold text-foreground">{reference || '—'}</span>
            <span className="text-[13px] font-medium text-foreground truncate">{fundingSourceNom || '—'}</span>
            {description && <span className="text-[10px] text-muted-foreground truncate">{description}</span>}
          </div>
        );
      },
    },
    {
      accessorKey: 'statut',
      header: 'Statut',
      cell: ({ getValue }) => {
        const s = getValue() as DisbursementStatut;
        return <Badge variant={statutVariant(s)} className="text-[11px] w-max">{STATUT_LABELS[s]}</Badge>;
      },
    },
    {
      accessorKey: 'montant',
      header: 'Montant',
      meta: { align: 'right' } as Record<string, unknown>,
      cell: ({ row }) => (
        <span className={`font-mono text-[12px] font-semibold ${row.original.statut === 'DECAISSE' ? 'text-success' : 'text-muted-foreground'}`}>
          {formatMontant(row.original.montant)}
        </span>
      ),
    },
    {
      accessorKey: 'datePrevue',
      header: 'Date prévue',
      meta: { align: 'center' } as Record<string, unknown>,
      cell: ({ row }) => {
        const late = isLate(row.original);
        return (
          <span className={`font-mono text-[12px] ${late ? 'text-destructive font-semibold' : 'text-muted-foreground'}`}>
            {formatDate(row.original.datePrevue)}
          </span>
        );
      },
    },
    {
      accessorKey: 'dateReelle',
      header: 'Date réelle',
      meta: { align: 'center' } as Record<string, unknown>,
      cell: ({ getValue }) => (
        <span className="font-mono text-[12px] text-muted-foreground">{formatDate(getValue() as string | null)}</span>
      ),
    },
    {
      id: 'actions',
      enableHiding: false,
      meta: { align: 'right' } as Record<string, unknown>,
      cell: ({ row }) => (
        <div className="flex items-center gap-1 justify-end">
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
  ];
}

// ─────────────────────────────────────────────────────────────────────────────
// Main export
// ─────────────────────────────────────────────────────────────────────────────

export default function ProjectDisbursementTab() {
  const { id: urlProjectId } = useParams<{ id: string }>();
  const activeProjectId = useUIStore(s => s.activeProjectId);
  const projectId = urlProjectId || activeProjectId || '';

  const { data: fundingSources = [] } = useFundingSources(projectId);
  const fundingSourceIds = useMemo(() => fundingSources.map(s => s.id), [fundingSources]);

  // Contrats et lignes budgétaires réels du projet — pour le rattachement
  // (disbursements.contract_id/budget_ligne_id) qui déclenche réellement
  // recalc_budget_ligne_montants côté montant_paye (cf. audit Décaissements).
  const { data: contracts = [] } = useContracts(projectId);
  const contractIds = useMemo(() => contracts.map(c => c.id), [contracts]);

  const { data: budget } = useBudget(projectId);
  const { data: budgetVersion } = useBudgetVersion(projectId, budget?.version_active_id);
  const budgetLignes = useMemo(() => budgetVersion?.lignes ?? [], [budgetVersion]);
  const budgetLigneIds = useMemo(() => budgetLignes.map(l => l.id), [budgetLignes]);

  const { data: records = [] } = useDisbursements(projectId, fundingSourceIds, budgetLigneIds, contractIds);
  const createMutation = useCreateDisbursement(projectId, fundingSourceIds, budgetLigneIds, contractIds);
  const updateMutation = useUpdateDisbursement(projectId, fundingSourceIds, budgetLigneIds, contractIds);
  const deleteMutation = useDeleteDisbursement(projectId, fundingSourceIds, budgetLigneIds, contractIds);

  // Miroir des rôles serveur (requireRole) sur disbursements-create/update
  // (COORDINATEUR/CHARGE_PROGRAMME/FINANCIER/ADMIN/SUPER_ADMIN) et -delete (ADMIN/SUPER_ADMIN).
  const currentRole = useAuthStore(s => s.user?.role);
  const canManage = !!currentRole && ['COORDINATEUR', 'CHARGE_PROGRAMME', 'FINANCIER', 'ADMIN', 'SUPER_ADMIN'].includes(currentRole);
  const canDelete = currentRole === 'ADMIN' || currentRole === 'SUPER_ADMIN';
  // Séparation des tâches : seul un rôle Financier (ou Admin) peut marquer un
  // décaissement comme réellement Décaissé — les autres rôles autorisés à
  // gérer les décaissements (COORDINATEUR/CHARGE_PROGRAMME) peuvent créer/
  // planifier/demander, mais pas exécuter l'acte de paiement final.
  const canSetDecaisse = currentRole === 'FINANCIER' || currentRole === 'ADMIN' || currentRole === 'SUPER_ADMIN';

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

  function handleSave(data: Partial<Disbursement>) {
    setSaveError(null);
    const onError = (err: unknown) => setSaveError(extractErrorMessage(err));
    if (slideOverMode === 'new') {
      createMutation.mutate(data, { onSuccess: () => setSlideOverOpen(false), onError });
    } else if (selectedRecord) {
      updateMutation.mutate({ id: selectedRecord.id, ...data }, { onSuccess: () => setSlideOverOpen(false), onError });
    }
  }

  const { montantTotal, montantDecaisse, enAttente, enRetard, decaisseCount } = useMemo(() => {
    const totalPrevu = records.reduce((s, r) => s + r.montant, 0);
    const totalDecaisse = records.filter(r => r.statut === 'DECAISSE').reduce((s, r) => s + r.montant, 0);
    return {
      montantTotal: totalPrevu,
      montantDecaisse: totalDecaisse,
      enAttente: records.filter(r => r.statut === 'DEMANDE' || r.statut === 'APPROUVE').length,
      enRetard: records.filter(isLate).length,
      decaisseCount: records.filter(r => r.statut === 'DECAISSE').length,
    };
  }, [records]);

  const tauxDec = montantTotal > 0 ? Math.round((montantDecaisse / montantTotal) * 100) : 0;

  // Évolution mensuelle — dérivée des vrais enregistrements (prévu vs décaissé par mois)
  const chartData = useMemo(() => {
    const byMonth = new Map<string, { prevu: number; recu: number }>();
    for (const r of records) {
      if (!r.datePrevue) continue;
      const month = r.datePrevue.slice(0, 7);
      const entry = byMonth.get(month) ?? { prevu: 0, recu: 0 };
      entry.prevu += r.montant;
      if (r.statut === 'DECAISSE') entry.recu += r.montant;
      byMonth.set(month, entry);
    }
    return Array.from(byMonth.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([mois, v]) => ({ mois, prevu: Math.round(v.prevu / 1_000_000 * 10) / 10, recu: Math.round(v.recu / 1_000_000 * 10) / 10 }));
  }, [records]);

  const columns = useMemo(
    () => buildDisbursementColumns(openView, openEdit, openDeleteModal, canManage, canDelete),
    [canManage, canDelete]
  );

  return (
    <section aria-label="Suivi des Décaissements" className="flex flex-col gap-6">

      {/* KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Décaissements"
          value={records.length}
          icon={<TrendingUp className="h-4 w-4 text-primary" aria-hidden="true" />}
          iconVariant="primary"
          description={`${decaisseCount} décaissé${decaisseCount > 1 ? 's' : ''}`}
        />
        <StatCard
          title="Taux de décaissement"
          value={`${tauxDec}%`}
          icon={<Wallet className="h-4 w-4 text-success" aria-hidden="true" />}
          iconVariant="success"
          description="Décaissé / Total"
        />
        <StatCard
          title="En Attente"
          value={enAttente}
          icon={<Clock className="h-4 w-4 text-warning" aria-hidden="true" />}
          iconVariant="warning"
          description="Demandés ou approuvés"
        />
        <StatCard
          title="En Retard"
          value={enRetard}
          icon={<AlertTriangle className="h-4 w-4 text-destructive" aria-hidden="true" />}
          iconVariant="destructive"
          description="Non décaissés à échéance"
        />
      </div>

      {/* Évolution Chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Évolution mensuelle des décaissements (M)</CardTitle>
        </CardHeader>
        <CardContent>
          <div role="img" aria-label="Graphique évolution mensuelle des décaissements prévus et reçus" className="h-[240px]">
            {chartData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-sm text-muted-foreground">Aucun décaissement enregistré</div>
            ) : (
              <ResponsiveContainer width="99%" height="100%">
                <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gradPrevu" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor={CHART_COLORS.prevu} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={CHART_COLORS.prevu} stopOpacity={0} />
                    </linearGradient>
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
                  <Area type="monotone" dataKey="prevu" name="Prévu" stroke={CHART_COLORS.prevu} fill="url(#gradPrevu)" strokeWidth={2} dot={false} />
                  <Area type="monotone" dataKey="recu"  name="Décaissé"  stroke={CHART_COLORS.recu}  fill="url(#gradRecu)"  strokeWidth={2} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </CardContent>
      </Card>

      {/* DataTable */}
      <Card>
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-base">Registre des décaissements ({records.length})</CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" aria-label="Exporter CSV" onClick={() => exportCsv(records)}>
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
          <DataTable
            columns={columns}
            data={records}
            searchKey="reference"
            searchPlaceholder="Rechercher par référence..."
            filters={[
              {
                id: 'statut', title: 'Statut',
                options: [
                  { label: 'Décaissé',  value: 'DECAISSE' },
                  { label: 'Approuvé',  value: 'APPROUVE' },
                  { label: 'Demandé',   value: 'DEMANDE' },
                  { label: 'Planifié',  value: 'PLANIFIE' },
                  { label: 'Rejeté',    value: 'REJETE' },
                ],
              },
            ]}
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
        fundingSourceOptions={fundingSources}
        contractOptions={contracts}
        budgetLigneOptions={budgetLignes}
        allDisbursements={records}
        canSetDecaisse={canSetDecaisse}
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
