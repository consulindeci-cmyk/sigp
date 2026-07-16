import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { ColumnDef } from '@tanstack/react-table';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { Wallet, TrendingUp, Clock, AlertTriangle, Plus, Eye, Edit, Trash2, X, Download } from 'lucide-react';
import { DataTable } from '@/components/ui/data-table/DataTable';
import { Badge } from '@/components/ui/data-display/Badge';
import { Button } from '@/components/ui/forms/Button';
import { Input } from '@/components/ui/forms/Input';
import { Select } from '@/components/ui/forms/Select';
import { StatCard } from '@/components/ui/data-display/StatCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/data-display/Card';
import {
  SlideOver, SlideOverContent, SlideOverHeader, SlideOverTitle,
  SlideOverBody, SlideOverFooter, SlideOverClose,
} from '@/components/ui/overlays/SlideOver';
import {
  Modal, ModalContent, ModalHeader, ModalTitle, ModalDescription,
  ModalFooter, ModalClose,
} from '@/components/ui/overlays/Modal';
import { useUIStore } from '@/stores/uiStore';
import { useFundingSources } from '@/hooks/useFundingSources';
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
  fundingSourceId: string; statut: string; montant: string;
  datePrevue: string; dateReelle: string; reference: string; description: string;
}

type DisbFormErrors = Partial<Record<keyof DisbFormValues, string>>;

const EMPTY_FORM: DisbFormValues = {
  fundingSourceId: '', statut: 'PLANIFIE', montant: '',
  datePrevue: '', dateReelle: '', reference: '', description: '',
};

function recordToForm(r: Disbursement): DisbFormValues {
  return {
    fundingSourceId: r.fundingSourceId ?? '',
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
// SlideOver — Voir / Ajouter / Modifier
// ─────────────────────────────────────────────────────────────────────────────

type SlideOverMode = 'view' | 'edit' | 'new';

function DisbursementSlideOver({
  open, onOpenChange, record, mode, onSave, fundingSourceOptions,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  record: Disbursement | null;
  mode: SlideOverMode;
  onSave?: (data: Partial<Disbursement>) => void;
  fundingSourceOptions: { id: string; nom: string }[];
}) {
  const [values, setValues] = useState<DisbFormValues>(EMPTY_FORM);
  const [errors, setErrors] = useState<DisbFormErrors>({});
  const readOnly = mode === 'view';

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

  function validate(): boolean {
    const errs: DisbFormErrors = {};
    if (!values.montant || Number(values.montant) <= 0) errs.montant = 'Montant requis (> 0)';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSave() {
    if (!validate()) return;
    onSave?.({
      fundingSourceId: values.fundingSourceId || null,
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
    <SlideOver open={open} onOpenChange={onOpenChange}>
      <SlideOverContent>
        <SlideOverHeader>
          <SlideOverTitle>{titles[mode]}</SlideOverTitle>
          <SlideOverClose asChild>
            <Button variant="ghost" size="sm" aria-label="Fermer"><X className="h-4 w-4" /></Button>
          </SlideOverClose>
        </SlideOverHeader>

        <SlideOverBody>
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
                <div className="sm:col-span-2">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Source de financement</p>
                  <p className="text-[13px] font-semibold text-foreground">{record.fundingSourceNom || '—'}</p>
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
              <FRow id="dis-source" label="Source de financement" full>
                <Select id="dis-source" value={values.fundingSourceId} onChange={e => set('fundingSourceId', e.target.value)}>
                  <option value="">Aucune</option>
                  {fundingSourceOptions.map(fs => <option key={fs.id} value={fs.id}>{fs.nom}</option>)}
                </Select>
              </FRow>

              <FRow id="dis-ref" label="Référence">
                <Input id="dis-ref" value={values.reference} onChange={e => set('reference', e.target.value)} placeholder="DEC-XXX-XXXX" />
              </FRow>

              <FRow id="dis-statut" label="Statut">
                <Select id="dis-statut" value={values.statut} onChange={e => set('statut', e.target.value)}>
                  <option value="PLANIFIE">Planifié</option>
                  <option value="DEMANDE">Demandé</option>
                  <option value="APPROUVE">Approuvé</option>
                  <option value="DECAISSE">Décaissé</option>
                  <option value="REJETE">Rejeté</option>
                </Select>
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
        </SlideOverBody>

        <SlideOverFooter>
          <SlideOverClose asChild>
            <Button variant="outline">{readOnly ? 'Fermer' : 'Annuler'}</Button>
          </SlideOverClose>
          {!readOnly && (
            <Button variant="default" onClick={handleSave}>{mode === 'edit' ? 'Enregistrer' : 'Ajouter'}</Button>
          )}
        </SlideOverFooter>
      </SlideOverContent>
    </SlideOver>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Column definitions
// ─────────────────────────────────────────────────────────────────────────────

function buildDisbursementColumns(
  onView:   (r: Disbursement) => void,
  onEdit:   (r: Disbursement) => void,
  onDelete: (id: string) => void,
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
          <Button variant="ghost" size="sm" aria-label="Modifier" onClick={() => onEdit(row.original)}><Edit className="h-3.5 w-3.5" /></Button>
          <Button variant="ghost" size="sm" aria-label="Supprimer" className="text-destructive hover:text-destructive" onClick={() => onDelete(row.original.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
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

  const { data: records = [] } = useDisbursements(projectId, fundingSourceIds);
  const createMutation = useCreateDisbursement(projectId, fundingSourceIds);
  const updateMutation = useUpdateDisbursement(projectId, fundingSourceIds);
  const deleteMutation = useDeleteDisbursement(projectId, fundingSourceIds);

  const [slideOverOpen, setSlideOverOpen]   = useState(false);
  const [slideOverMode, setSlideOverMode]   = useState<SlideOverMode>('new');
  const [selectedRecord, setSelectedRecord] = useState<Disbursement | null>(null);

  const [deleteModalOpen,  setDeleteModalOpen]  = useState(false);
  const [recordToDelete,   setRecordToDelete]   = useState<string | null>(null);

  function openView(r: Disbursement) { setSelectedRecord(r); setSlideOverMode('view'); setSlideOverOpen(true); }
  function openEdit(r: Disbursement) { setSelectedRecord(r); setSlideOverMode('edit'); setSlideOverOpen(true); }
  function openDeleteModal(id: string) { setRecordToDelete(id); setDeleteModalOpen(true); }

  function handleDeleteConfirm() {
    if (recordToDelete) deleteMutation.mutate(recordToDelete);
    setDeleteModalOpen(false);
    setRecordToDelete(null);
  }

  function handleSave(data: Partial<Disbursement>) {
    if (slideOverMode === 'new') {
      createMutation.mutate(data);
    } else if (selectedRecord) {
      updateMutation.mutate({ id: selectedRecord.id, ...data });
    }
    setSlideOverOpen(false);
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
    () => buildDisbursementColumns(openView, openEdit, openDeleteModal),
    []
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
            <Button
              variant="default" size="sm" aria-label="Ajouter un décaissement"
              onClick={() => { setSelectedRecord(null); setSlideOverMode('new'); setSlideOverOpen(true); }}
            >
              <Plus className="h-4 w-4 mr-1.5" aria-hidden="true" />
              Ajouter
            </Button>
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

      {/* ── SlideOver ────────────────────────────────────────────────────── */}
      <DisbursementSlideOver
        open={slideOverOpen}
        onOpenChange={setSlideOverOpen}
        record={selectedRecord}
        mode={slideOverMode}
        onSave={handleSave}
        fundingSourceOptions={fundingSources}
      />

      {/* ── Delete Confirmation Modal ──────────────────────────────────── */}
      <Modal open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <ModalContent>
          <ModalHeader>
            <ModalTitle>Confirmer la suppression</ModalTitle>
            <ModalDescription>
              Êtes-vous sûr de vouloir supprimer ce décaissement ? Cette action est irréversible.
            </ModalDescription>
          </ModalHeader>
          <ModalFooter>
            <ModalClose asChild>
              <Button variant="outline">Annuler</Button>
            </ModalClose>
            <Button variant="destructive" onClick={handleDeleteConfirm}>
              <Trash2 className="h-4 w-4 mr-1.5" aria-hidden="true" />
              Supprimer
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </section>
  );
}
