import { useState, useEffect, useMemo, useCallback } from 'react';
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
import { ProgressBar } from '@/components/ui/data-display/ProgressBar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/data-display/Card';
import {
  SlideOver, SlideOverContent, SlideOverHeader, SlideOverTitle,
  SlideOverBody, SlideOverFooter, SlideOverClose,
} from '@/components/ui/overlays/SlideOver';
import {
  Modal, ModalContent, ModalHeader, ModalTitle, ModalDescription,
  ModalFooter, ModalClose,
} from '@/components/ui/overlays/Modal';
import {
  mockDisbursementRecords,
  mockDisbursementChart,
  type DisbursementRecord,
  type DisbursementStatus,
  type DisbursementDevise,
} from '@/mocks/disbursementMocks';

// ─────────────────────────────────────────────────────────────────────────────
// CSV Export
// ─────────────────────────────────────────────────────────────────────────────

function exportCsv(records: DisbursementRecord[]) {
  const HEADERS = [
    'Référence', 'Bailleur', 'Convention', 'Tranche', 'Statut', 'Devise',
    'Montant Prévu', 'Montant Reçu', 'Solde',
    'Date Prévue', 'Date Réception',
  ];
  const rows = records.map(r => [
    r.reference, r.bailleur, r.convention, r.tranche, r.statut, r.devise,
    r.montantPrevu, r.montantRecu, r.solde,
    r.datePrevue, r.dateReception ?? '',
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

function formatMontant(value: number, devise: DisbursementDevise): string {
  if (devise === 'XOF') {
    return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(value) + ' XOF';
  }
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency', currency: devise,
    minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(value);
}

function statutVariant(statut: DisbursementStatus): 'success' | 'warning' | 'secondary' | 'destructive' {
  switch (statut) {
    case 'Reçu':       return 'success';
    case 'En attente': return 'warning';
    case 'Planifié':   return 'secondary';
    case 'En retard':  return 'destructive';
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Controlled form state
// ─────────────────────────────────────────────────────────────────────────────

interface DisbFormValues {
  bailleur:      string;
  convention:    string;
  reference:     string;
  tranche:       string;
  montantPrevu:  string;
  montantRecu:   string;
  devise:        string;
  statut:        string;
  datePrevue:    string;
  dateReception: string;
}

type DisbFormErrors = Partial<Record<keyof DisbFormValues, string>>;

const EMPTY_FORM: DisbFormValues = {
  bailleur: '', convention: '', reference: '', tranche: '',
  montantPrevu: '', montantRecu: '0',
  devise: 'USD', statut: 'Planifié',
  datePrevue: '', dateReception: '',
};

function recordToForm(r: DisbursementRecord): DisbFormValues {
  return {
    bailleur:      r.bailleur,
    convention:    r.convention,
    reference:     r.reference,
    tranche:       r.tranche,
    montantPrevu:  String(r.montantPrevu),
    montantRecu:   String(r.montantRecu),
    devise:        r.devise,
    statut:        r.statut,
    datePrevue:    r.datePrevue,
    dateReception: r.dateReception ?? '',
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
  open, onOpenChange, record, mode, onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  record: DisbursementRecord | null;
  mode: SlideOverMode;
  onSave?: (data: Partial<DisbursementRecord>) => void;
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
    if (!values.bailleur.trim())   errs.bailleur   = 'Requis';
    if (!values.reference.trim())  errs.reference  = 'Requis';
    if (!values.tranche.trim())    errs.tranche    = 'Requis';
    if (!values.datePrevue)        errs.datePrevue = 'Requis';
    if (!values.montantPrevu || Number(values.montantPrevu) <= 0)
      errs.montantPrevu = 'Montant requis (> 0)';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSave() {
    if (!validate()) return;
    const montantPrevu = Number(values.montantPrevu);
    const montantRecu  = Number(values.montantRecu) || 0;
    onSave?.({
      bailleur:      values.bailleur.trim(),
      convention:    values.convention.trim(),
      reference:     values.reference.trim(),
      tranche:       values.tranche.trim(),
      montantPrevu,
      montantRecu,
      solde:         montantPrevu - montantRecu,
      devise:        values.devise as DisbursementDevise,
      statut:        values.statut as DisbursementStatus,
      datePrevue:    values.datePrevue,
      dateReception: values.dateReception || null,
    });
  }

  const titles: Record<SlideOverMode, string> = {
    view: 'Détails du décaissement',
    edit: 'Modifier le décaissement',
    new:  'Nouveau décaissement',
  };

  return (
    <SlideOver open={open} onOpenChange={onOpenChange}>
      <SlideOverContent>
        <SlideOverHeader>
          <SlideOverTitle>{titles[mode]}</SlideOverTitle>
          <SlideOverClose asChild>
            <Button variant="ghost" size="sm" aria-label="Fermer">
              <X className="h-4 w-4" />
            </Button>
          </SlideOverClose>
        </SlideOverHeader>

        <SlideOverBody>
          {readOnly && record ? (
            // ── View mode ────────────────────────────────────────────────
            <div className="flex flex-col gap-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Référence</p>
                  <p className="font-mono text-[14px] font-semibold text-foreground">{record.reference}</p>
                </div>
                <Badge variant={statutVariant(record.statut)} className="text-[12px]">{record.statut}</Badge>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-border pt-4">
                <div className="sm:col-span-2">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Bailleur</p>
                  <p className="text-[13px] font-semibold text-foreground">{record.bailleur}</p>
                </div>
                <div className="sm:col-span-2">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Convention</p>
                  <p className="font-mono text-[12px] text-muted-foreground">{record.convention}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Tranche</p>
                  <p className="text-[13px] text-foreground">{record.tranche}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Devise</p>
                  <span className="font-mono text-[12px] font-bold bg-muted text-muted-foreground px-2 py-0.5 rounded">
                    {record.devise}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 bg-muted/40 rounded-lg p-4">
                <div className="text-center">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Prévu</p>
                  <p className="font-mono text-[13px] font-semibold text-foreground">
                    {formatMontant(record.montantPrevu, record.devise)}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Reçu</p>
                  <p className="font-mono text-[13px] font-semibold text-success">
                    {formatMontant(record.montantRecu, record.devise)}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Solde</p>
                  <p className={`font-mono text-[13px] font-semibold ${record.solde > 0 ? 'text-warning' : 'text-muted-foreground'}`}>
                    {formatMontant(record.solde, record.devise)}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t border-border pt-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Date prévue</p>
                  <p className="font-mono text-[13px] text-foreground">{formatDate(record.datePrevue)}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Date de réception</p>
                  <p className="font-mono text-[13px] text-foreground">{formatDate(record.dateReception)}</p>
                </div>
              </div>
            </div>
          ) : (
            // ── Edit / New mode — controlled form ─────────────────────────
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FRow id="dis-bailleur" label="Bailleur" error={errors.bailleur} full>
                <Input
                  id="dis-bailleur"
                  value={values.bailleur}
                  onChange={e => set('bailleur', e.target.value)}
                  placeholder="Nom du bailleur"
                />
              </FRow>

              <FRow id="dis-convention" label="Convention" full>
                <Input
                  id="dis-convention"
                  value={values.convention}
                  onChange={e => set('convention', e.target.value)}
                  placeholder="Réf. convention"
                />
              </FRow>

              <FRow id="dis-ref" label="Référence" error={errors.reference}>
                <Input
                  id="dis-ref"
                  value={values.reference}
                  onChange={e => set('reference', e.target.value)}
                  placeholder="DEC-XXX-XXXX"
                />
              </FRow>

              <FRow id="dis-tranche" label="Tranche" error={errors.tranche}>
                <Input
                  id="dis-tranche"
                  value={values.tranche}
                  onChange={e => set('tranche', e.target.value)}
                  placeholder="Tranche 1"
                />
              </FRow>

              <FRow id="dis-prevu" label="Montant prévu" error={errors.montantPrevu}>
                <Input
                  id="dis-prevu"
                  type="number"
                  min={0}
                  value={values.montantPrevu}
                  onChange={e => set('montantPrevu', e.target.value)}
                  placeholder="0"
                />
              </FRow>

              <FRow id="dis-recu" label="Montant reçu">
                <Input
                  id="dis-recu"
                  type="number"
                  min={0}
                  value={values.montantRecu}
                  onChange={e => set('montantRecu', e.target.value)}
                  placeholder="0"
                />
              </FRow>

              <FRow id="dis-devise" label="Devise">
                <Select id="dis-devise" value={values.devise} onChange={e => set('devise', e.target.value)}>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="XOF">XOF</option>
                </Select>
              </FRow>

              <FRow id="dis-statut" label="Statut">
                <Select id="dis-statut" value={values.statut} onChange={e => set('statut', e.target.value)}>
                  <option value="Planifié">Planifié</option>
                  <option value="En attente">En attente</option>
                  <option value="Reçu">Reçu</option>
                  <option value="En retard">En retard</option>
                </Select>
              </FRow>

              <FRow id="dis-datep" label="Date prévue" error={errors.datePrevue}>
                <Input
                  id="dis-datep"
                  type="date"
                  value={values.datePrevue}
                  onChange={e => set('datePrevue', e.target.value)}
                />
              </FRow>

              <FRow id="dis-dater" label="Date de réception">
                <Input
                  id="dis-dater"
                  type="date"
                  value={values.dateReception}
                  onChange={e => set('dateReception', e.target.value)}
                />
              </FRow>
            </div>
          )}
        </SlideOverBody>

        <SlideOverFooter>
          <SlideOverClose asChild>
            <Button variant="outline">{readOnly ? 'Fermer' : 'Annuler'}</Button>
          </SlideOverClose>
          {!readOnly && (
            <Button variant="default" onClick={handleSave}>
              {mode === 'edit' ? 'Enregistrer' : 'Ajouter'}
            </Button>
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
  onView:   (r: DisbursementRecord) => void,
  onEdit:   (r: DisbursementRecord) => void,
  onDelete: (id: string) => void,
): ColumnDef<DisbursementRecord, unknown>[] {
  return [
    {
      id: 'identification',
      accessorKey: 'reference',
      header: 'Référence & Bailleur',
      meta: { isSticky: true } as Record<string, unknown>,
      cell: ({ row }) => {
        const { reference, bailleur, convention, tranche } = row.original;
        return (
          <div className="flex flex-col gap-0.5 min-w-[200px] max-w-[280px]">
            <span className="font-mono text-[12px] font-semibold text-foreground">{reference}</span>
            <span className="text-[13px] font-medium text-foreground truncate">{bailleur}</span>
            <span className="text-[10px] text-muted-foreground truncate">{convention} — {tranche}</span>
          </div>
        );
      },
    },
    {
      accessorKey: 'statut',
      header: 'Statut',
      cell: ({ getValue }) => {
        const s = getValue() as DisbursementStatus;
        return <Badge variant={statutVariant(s)} className="text-[11px] w-max">{s}</Badge>;
      },
    },
    {
      accessorKey: 'montantPrevu',
      header: 'Montant prévu',
      meta: { align: 'right' } as Record<string, unknown>,
      cell: ({ row }) => (
        <span className="font-mono text-[12px] text-muted-foreground">
          {formatMontant(row.original.montantPrevu, row.original.devise)}
        </span>
      ),
    },
    {
      accessorKey: 'montantRecu',
      header: 'Montant reçu',
      meta: { align: 'right' } as Record<string, unknown>,
      cell: ({ row }) => (
        <span className={`font-mono text-[12px] font-semibold ${row.original.montantRecu > 0 ? 'text-success' : 'text-muted-foreground'}`}>
          {formatMontant(row.original.montantRecu, row.original.devise)}
        </span>
      ),
    },
    {
      accessorKey: 'solde',
      header: 'Solde',
      meta: { align: 'right' } as Record<string, unknown>,
      cell: ({ row }) => {
        const { solde, devise } = row.original;
        return (
          <span className={`font-mono text-[12px] ${solde > 0 ? 'text-warning font-semibold' : 'text-muted-foreground'}`}>
            {formatMontant(solde, devise)}
          </span>
        );
      },
    },
    {
      id: 'taux',
      header: '% Reçu',
      cell: ({ row }) => {
        const { montantPrevu, montantRecu } = row.original;
        const pct = montantPrevu > 0 ? Math.round((montantRecu / montantPrevu) * 100) : 0;
        const color = pct >= 80 ? 'success' : pct >= 40 ? 'warning' : 'destructive';
        return (
          <div className="flex flex-col gap-1 min-w-[80px]">
            <span className="font-mono text-[11px] font-semibold text-foreground">{pct}%</span>
            <ProgressBar value={pct} size="xs" color={color} aria-label={`${pct}% reçu`} />
          </div>
        );
      },
    },
    {
      accessorKey: 'datePrevue',
      header: 'Date prévue',
      meta: { align: 'center' } as Record<string, unknown>,
      cell: ({ getValue }) => (
        <span className="font-mono text-[12px] text-muted-foreground">{formatDate(getValue() as string)}</span>
      ),
    },
    {
      accessorKey: 'dateReception',
      header: 'Réception',
      meta: { align: 'center' } as Record<string, unknown>,
      cell: ({ getValue }) => (
        <span className="font-mono text-[12px] text-muted-foreground">{formatDate(getValue() as string | null)}</span>
      ),
    },
    {
      accessorKey: 'devise',
      header: 'Devise',
      meta: { align: 'center' } as Record<string, unknown>,
      cell: ({ getValue }) => (
        <span className="font-mono text-[11px] font-bold bg-muted text-muted-foreground px-1.5 py-0.5 rounded">
          {getValue() as string}
        </span>
      ),
    },
    {
      id: 'actions',
      enableHiding: false,
      meta: { align: 'right' } as Record<string, unknown>,
      cell: ({ row }) => (
        <div className="flex items-center gap-1 justify-end">
          <Button variant="ghost" size="sm" aria-label="Voir les détails" onClick={() => onView(row.original)}>
            <Eye className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="sm" aria-label="Modifier" onClick={() => onEdit(row.original)}>
            <Edit className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost" size="sm" aria-label="Supprimer"
            className="text-destructive hover:text-destructive"
            onClick={() => onDelete(row.original.id)}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      ),
    },
  ];
}

// ─────────────────────────────────────────────────────────────────────────────
// Main export
// ─────────────────────────────────────────────────────────────────────────────

export default function ProjectDisbursementTab() {
  const [records, setRecords] = useState<DisbursementRecord[]>(mockDisbursementRecords);
  const [slideOverOpen, setSlideOverOpen]   = useState(false);
  const [slideOverMode, setSlideOverMode]   = useState<SlideOverMode>('new');
  const [selectedRecord, setSelectedRecord] = useState<DisbursementRecord | null>(null);

  // Delete confirmation
  const [deleteModalOpen,  setDeleteModalOpen]  = useState(false);
  const [recordToDelete,   setRecordToDelete]   = useState<string | null>(null);

  function openView(r: DisbursementRecord) {
    setSelectedRecord(r); setSlideOverMode('view'); setSlideOverOpen(true);
  }
  function openEdit(r: DisbursementRecord) {
    setSelectedRecord(r); setSlideOverMode('edit'); setSlideOverOpen(true);
  }
  function openDeleteModal(id: string) {
    setRecordToDelete(id); setDeleteModalOpen(true);
  }
  function handleDeleteConfirm() {
    if (recordToDelete) setRecords(prev => prev.filter(r => r.id !== recordToDelete));
    setDeleteModalOpen(false);
    setRecordToDelete(null);
  }

  function handleSave(data: Partial<DisbursementRecord>) {
    if (slideOverMode === 'new') {
      const newRecord: DisbursementRecord = {
        id: `d-${Date.now()}`,
        bailleur:      data.bailleur      ?? '',
        convention:    data.convention    ?? '',
        reference:     data.reference     ?? '',
        tranche:       data.tranche       ?? '',
        montantPrevu:  data.montantPrevu  ?? 0,
        montantRecu:   data.montantRecu   ?? 0,
        solde:         data.solde         ?? 0,
        datePrevue:    data.datePrevue    ?? '',
        dateReception: data.dateReception ?? null,
        statut:        data.statut        ?? 'Planifié',
        devise:        data.devise        ?? 'USD',
      };
      setRecords(prev => [newRecord, ...prev]);
    } else if (selectedRecord) {
      setRecords(prev => prev.map(r =>
        r.id === selectedRecord.id ? { ...r, ...data } : r
      ));
    }
    setSlideOverOpen(false);
  }

  // Dynamic KPIs
  const { tauxDec, enAttente, enRetard, recu } = useMemo(() => {
    const totalPrevu = records.reduce((s, r) => s + r.montantPrevu, 0);
    const totalRecu  = records.reduce((s, r) => s + r.montantRecu, 0);
    return {
      tauxDec:   totalPrevu > 0 ? Math.round((totalRecu / totalPrevu) * 100) : 0,
      enAttente: records.filter(r => r.statut === 'En attente').length,
      enRetard:  records.filter(r => r.statut === 'En retard').length,
      recu:      records.filter(r => r.statut === 'Reçu').length,
    };
  }, [records]);

  const openViewCb   = useCallback(openView,   []);
  const openEditCb   = useCallback(openEdit,   []);
  const openDeleteCb = useCallback(openDeleteModal, []);

  const columns = useMemo(
    () => buildDisbursementColumns(openViewCb, openEditCb, openDeleteCb),
    [openViewCb, openEditCb, openDeleteCb]
  );

  return (
    <section aria-label="Suivi des Décaissements" className="flex flex-col gap-6">

      {/* KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Tranches"
          value={records.length}
          icon={<TrendingUp className="h-4 w-4 text-primary" aria-hidden="true" />}
          iconVariant="primary"
          description={`${recu} tranche${recu > 1 ? 's' : ''} reçue${recu > 1 ? 's' : ''}`}
        />
        <StatCard
          title="Taux de décaissement"
          value={`${tauxDec}%`}
          icon={<Wallet className="h-4 w-4 text-success" aria-hidden="true" />}
          iconVariant="success"
          description="Reçu / Prévu (multi-devises)"
        />
        <StatCard
          title="En Attente"
          value={enAttente}
          icon={<Clock className="h-4 w-4 text-warning" aria-hidden="true" />}
          iconVariant="warning"
          description={`${recu} décaissement${recu > 1 ? 's' : ''} reçu${recu > 1 ? 's' : ''}`}
        />
        <StatCard
          title="En Retard"
          value={enRetard}
          icon={<AlertTriangle className="h-4 w-4 text-destructive" aria-hidden="true" />}
          iconVariant="destructive"
          description="Tranches non reçues à échéance"
        />
      </div>

      {/* Évolution Chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Évolution mensuelle des décaissements (M USD éq.)</CardTitle>
        </CardHeader>
        <CardContent>
          <div
            role="img"
            aria-label="Graphique évolution mensuelle des décaissements prévus et reçus"
            className="h-[240px]"
          >
            <ResponsiveContainer width="99%" height="100%">
              <AreaChart data={mockDisbursementChart} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
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
                <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`${v}M USD éq.`, undefined]} />
                <Legend iconType="circle" iconSize={8} formatter={(v: string) => <span className="text-[11px] text-muted-foreground">{v}</span>} />
                <Area type="monotone" dataKey="prevu" name="Prévu" stroke={CHART_COLORS.prevu} fill="url(#gradPrevu)" strokeWidth={2} dot={false} />
                <Area type="monotone" dataKey="recu"  name="Reçu"  stroke={CHART_COLORS.recu}  fill="url(#gradRecu)"  strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
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
                  { label: 'Reçu',       value: 'Reçu' },
                  { label: 'En attente', value: 'En attente' },
                  { label: 'Planifié',   value: 'Planifié' },
                  { label: 'En retard',  value: 'En retard' },
                ],
              },
              {
                id: 'devise', title: 'Devise',
                options: [
                  { label: 'USD', value: 'USD' },
                  { label: 'EUR', value: 'EUR' },
                  { label: 'XOF', value: 'XOF' },
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
