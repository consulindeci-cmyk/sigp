import { useState, useMemo, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { ColumnDef } from '@tanstack/react-table';
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import {
  Banknote, Users, TrendingUp, Plus, Eye, Edit, Trash2,
  Download, CheckCircle2, AlertCircle, CalendarDays,
} from 'lucide-react';
import { DataTable } from '@/components/ui/data-table/DataTable';
import { Badge } from '@/components/ui/data-display/Badge';
import { Button } from '@/components/ui/forms/Button';
import { Input } from '@/components/ui/forms/Input';
import { Select } from '@/components/ui/forms/Select';
import { Textarea } from '@/components/ui/forms/Textarea';
import { StatCard } from '@/components/ui/data-display/StatCard';
import { ProgressBar } from '@/components/ui/data-display/ProgressBar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/data-display/Card';
import {
  Modal, ModalContent, ModalHeader, ModalTitle, ModalFooter, ModalClose,
} from '@/components/ui/overlays/Modal';
import { useUIStore } from '@/stores/uiStore';
import { useAuthStore } from '@/stores/authStore';
import {
  useFundingSources, useCreateFundingSource, useUpdateFundingSource, useDeleteFundingSource,
  type FundingSource, type FundingSourceType,
} from '@/hooks/useFundingSources';

// ─────────────────────────────────────────────────────────────────────────────
// Constantes
// ─────────────────────────────────────────────────────────────────────────────

const PIE_COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--success))',
  'hsl(var(--warning))',
  'hsl(var(--destructive))',
  '#6366f1',
  '#f59e0b',
];

const tooltipStyle = {
  backgroundColor: 'hsl(var(--card))',
  border: '1px solid hsl(var(--border))',
  borderRadius: '8px',
  color: 'hsl(var(--foreground))',
  fontSize: '12px',
};

const TYPE_LABELS: Record<FundingSourceType, string> = {
  BAILLEUR: 'Bailleur',
  CONTREPARTIE_NATIONALE: 'Contrepartie nationale',
  AUTRE: 'Autre',
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

function formatMontant(value: number, devise: string): string {
  if (devise === 'XOF') {
    return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(value) + ' XOF';
  }
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: devise,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function isExpiringSoon(dateStr: string | null): boolean {
  if (!dateStr) return false;
  return new Date(dateStr) < new Date(Date.now() + 180 * 24 * 60 * 60 * 1000);
}

function isExpired(dateStr: string | null): boolean {
  if (!dateStr) return false;
  return new Date(dateStr) < new Date();
}

function exportCsv(sources: FundingSource[]) {
  const HEADERS = ['Nom', 'Type', 'Montant', 'Devise', '% Contribution', 'Date accord', 'Date expiration', 'Contact'];
  const rows = sources.map(s => [
    s.nom, TYPE_LABELS[s.type], String(s.montant), s.devise, String(s.pourcentage ?? ''),
    s.dateAccord ?? '', s.dateExpiry ?? '', s.contact ?? '',
  ]);
  const csv = '﻿' + [HEADERS, ...rows]
    .map(row => row.map(c => `"${String(c).replace(/"/g, '""')}"`).join(';'))
    .join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `sources-financement-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ─────────────────────────────────────────────────────────────────────────────
// Form state
// ─────────────────────────────────────────────────────────────────────────────

interface FundingFormValues {
  nom: string; type: string; montant: string; pourcentage: string; devise: string;
  dateAccord: string; dateExpiry: string; contact: string; notes: string;
}

type FundingFormErrors = Partial<Record<keyof FundingFormValues, string>>;

const EMPTY_FORM: FundingFormValues = {
  nom: '', type: 'BAILLEUR', montant: '', pourcentage: '', devise: 'XOF',
  dateAccord: '', dateExpiry: '', contact: '', notes: '',
};

function formFromSource(s: FundingSource): FundingFormValues {
  return {
    nom: s.nom, type: s.type, montant: String(s.montant), pourcentage: s.pourcentage !== null ? String(s.pourcentage) : '',
    devise: s.devise, dateAccord: s.dateAccord ?? '', dateExpiry: s.dateExpiry ?? '',
    contact: s.contact ?? '', notes: s.notes ?? '',
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Tooltip Pie
// ─────────────────────────────────────────────────────────────────────────────

function FundingTooltip({ active, payload }: { active?: boolean; payload?: Array<{ name: string; value: number }> }) {
  if (!active || !payload?.length) return null;
  const { name, value } = payload[0];
  return (
    <div style={tooltipStyle} className="px-3 py-2 shadow-sm">
      <p className="font-semibold text-foreground text-[13px]">{name}</p>
      <p className="text-muted-foreground text-[12px]">{value}% du financement</p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Modal (view / edit / new) — centrée, remplace l'ancien SlideOver latéral
// ─────────────────────────────────────────────────────────────────────────────

type SlideOverMode = 'view' | 'edit' | 'new';

function FundingSourceModal({
  open, onOpenChange, source, mode, onSave, isSaving, error,
}: {
  open:         boolean;
  onOpenChange: (open: boolean) => void;
  source:       FundingSource | null;
  mode:         SlideOverMode;
  onSave:       (data: Partial<FundingSource>) => void;
  isSaving?:    boolean;
  error?:       string | null;
}) {
  const titles: Record<SlideOverMode, string> = {
    view: 'Détails de la source de financement',
    edit: 'Modifier la source de financement',
    new:  'Nouvelle source de financement',
  };
  const readOnly = mode === 'view';

  const [form, setForm]     = useState<FundingFormValues>(EMPTY_FORM);
  const [errors, setErrors] = useState<FundingFormErrors>({});

  useEffect(() => {
    if (open) {
      setForm(source && mode !== 'new' ? formFromSource(source) : EMPTY_FORM);
      setErrors({});
    }
  }, [open, source, mode]);

  function set(field: keyof FundingFormValues, value: string) {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => { const n = { ...prev }; delete n[field]; return n; });
  }

  function validate(): boolean {
    const errs: FundingFormErrors = {};
    if (!form.nom.trim()) errs.nom = 'Requis';
    const montant = Number(form.montant);
    if (isNaN(montant) || montant <= 0) errs.montant = 'Doit être > 0';
    const pct = form.pourcentage === '' ? 0 : Number(form.pourcentage);
    if (pct < 0 || pct > 100) errs.pourcentage = 'Entre 0 et 100';
    if (form.dateExpiry && form.dateAccord && form.dateExpiry < form.dateAccord) {
      errs.dateExpiry = 'Doit être postérieure à la date d\'accord';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSave() {
    if (!validate()) return;
    onSave({
      nom: form.nom.trim(),
      type: form.type as FundingSourceType,
      montant: Number(form.montant),
      pourcentage: form.pourcentage === '' ? null : Number(form.pourcentage),
      devise: form.devise,
      dateAccord: form.dateAccord || null,
      dateExpiry: form.dateExpiry || null,
      contact: form.contact.trim() || null,
      notes: form.notes.trim() || null,
    });
  }

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent className="max-w-2xl max-h-[90vh] flex flex-col p-0 gap-0">
        <ModalHeader className="px-6 py-4 border-b border-border shrink-0 space-y-1">
          <ModalTitle>{titles[mode]}</ModalTitle>
        </ModalHeader>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {readOnly && source ? (
            <div className="flex flex-col gap-5">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline" className="text-[11px]">{TYPE_LABELS[source.type]}</Badge>
                <Badge variant="outline" className="font-mono text-[10px]">{source.devise}</Badge>
              </div>

              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Nom</p>
                <p className="text-[15px] font-semibold text-foreground">{source.nom}</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-border pt-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Montant</p>
                  <p className="font-mono text-[14px] font-bold text-foreground">{formatMontant(source.montant, source.devise)}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">% Contribution</p>
                  <p className="font-mono text-[14px] font-bold text-primary">{source.pourcentage ?? 0}%</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-border pt-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Date d'accord</p>
                  <div className="flex items-center gap-1.5">
                    <CalendarDays className="h-3.5 w-3.5 text-muted-foreground shrink-0" aria-hidden="true" />
                    <p className="font-mono text-[13px] text-foreground">{formatDate(source.dateAccord)}</p>
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Date d'expiration</p>
                  <div className="flex items-center gap-1.5">
                    <CalendarDays className="h-3.5 w-3.5 text-muted-foreground shrink-0" aria-hidden="true" />
                    <p className={`font-mono text-[13px] ${isExpired(source.dateExpiry) ? 'text-destructive font-semibold' : isExpiringSoon(source.dateExpiry) ? 'text-warning font-semibold' : 'text-foreground'}`}>
                      {formatDate(source.dateExpiry)}
                    </p>
                  </div>
                </div>
              </div>

              {(source.contact || source.notes) && (
                <div className="grid grid-cols-1 gap-4 border-t border-border pt-4">
                  {source.contact && (
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Contact</p>
                      <p className="text-[13px] text-foreground">{source.contact}</p>
                    </div>
                  )}
                  {source.notes && (
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Notes</p>
                      <p className="text-[13px] text-foreground leading-relaxed">{source.notes}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <label className="text-sm font-medium text-foreground" htmlFor="fs-nom">Nom *</label>
                <Input id="fs-nom" value={form.nom} onChange={e => set('nom', e.target.value)} placeholder="Nom du bailleur / de la source" className={errors.nom ? 'border-destructive' : ''} />
                {errors.nom && <p className="text-[11px] text-destructive">{errors.nom}</p>}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-foreground" htmlFor="fs-type">Type</label>
                <Select id="fs-type" value={form.type} onChange={e => set('type', e.target.value)}>
                  <option value="BAILLEUR">Bailleur</option>
                  <option value="CONTREPARTIE_NATIONALE">Contrepartie nationale</option>
                  <option value="AUTRE">Autre</option>
                </Select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-foreground" htmlFor="fs-devise">Devise</label>
                <Select id="fs-devise" value={form.devise} onChange={e => set('devise', e.target.value)}>
                  <option value="XOF">XOF (FCFA)</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                </Select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-foreground" htmlFor="fs-montant">Montant *</label>
                <Input id="fs-montant" type="number" min={0} value={form.montant} onChange={e => set('montant', e.target.value)} placeholder="0" className={errors.montant ? 'border-destructive' : ''} />
                {errors.montant && <p className="text-[11px] text-destructive">{errors.montant}</p>}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-foreground" htmlFor="fs-pct">% Contribution</label>
                <Input id="fs-pct" type="number" min={0} max={100} value={form.pourcentage} onChange={e => set('pourcentage', e.target.value)} placeholder="0" className={errors.pourcentage ? 'border-destructive' : ''} />
                {errors.pourcentage && <p className="text-[11px] text-destructive">{errors.pourcentage}</p>}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-foreground" htmlFor="fs-accord">Date d'accord</label>
                <Input id="fs-accord" type="date" value={form.dateAccord} onChange={e => set('dateAccord', e.target.value)} />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-foreground" htmlFor="fs-expiry">Date d'expiration</label>
                <Input id="fs-expiry" type="date" value={form.dateExpiry} onChange={e => set('dateExpiry', e.target.value)} className={errors.dateExpiry ? 'border-destructive' : ''} />
                {errors.dateExpiry && <p className="text-[11px] text-destructive">{errors.dateExpiry}</p>}
              </div>

              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <label className="text-sm font-medium text-foreground" htmlFor="fs-contact">Contact</label>
                <Input id="fs-contact" value={form.contact} onChange={e => set('contact', e.target.value)} placeholder="Nom / email du point focal" />
              </div>

              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <label className="text-sm font-medium text-foreground" htmlFor="fs-notes">Notes</label>
                <Textarea id="fs-notes" value={form.notes} onChange={e => set('notes', e.target.value)} rows={3} placeholder="Notes complémentaires" />
              </div>
            </div>
          )}

          {error && (
            <div className="mt-4 flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive" role="alert">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" aria-hidden="true" />
              <span>{error}</span>
            </div>
          )}
        </div>

        <ModalFooter className="px-6 py-4 border-t border-border bg-muted/20 shrink-0">
          <ModalClose asChild>
            <Button variant="outline" type="button">{readOnly ? 'Fermer' : 'Annuler'}</Button>
          </ModalClose>
          {!readOnly && (
            <Button variant="default" onClick={handleSave} disabled={isSaving}>
              {isSaving ? 'Enregistrement...' : mode === 'edit' ? 'Enregistrer' : 'Ajouter'}
            </Button>
          )}
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Modal de confirmation de suppression
// ─────────────────────────────────────────────────────────────────────────────

function DeleteConfirmModal({
  source, onConfirm, onCancel, isDeleting, error,
}: {
  source:     FundingSource | null;
  onConfirm:  () => void;
  onCancel:   () => void;
  isDeleting?: boolean;
  error?:      string | null;
}) {
  if (!source) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40" role="dialog" aria-modal="true" aria-labelledby="del-fs-modal-title">
      <div className="bg-card border border-border rounded-lg shadow-lg p-6 max-w-sm w-full mx-4 flex flex-col gap-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" aria-hidden="true" />
          <div>
            <h3 id="del-fs-modal-title" className="text-sm font-bold text-foreground">Supprimer la source</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Supprimer <span className="font-semibold text-foreground">« {source.nom} »</span> ? Cette action est irréversible.
            </p>
          </div>
        </div>
        {error && (
          <p className="text-sm text-destructive flex items-start gap-1.5" role="alert">
            <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" aria-hidden="true" />
            {error}
          </p>
        )}
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onCancel}>Annuler</Button>
          <Button variant="destructive" size="sm" onClick={onConfirm} disabled={isDeleting}>
            {isDeleting ? 'Suppression...' : 'Supprimer'}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Colonnes DataTable
// ─────────────────────────────────────────────────────────────────────────────

function buildFundingColumns(
  onView:     (s: FundingSource) => void,
  onEdit:     (s: FundingSource) => void,
  onDelete:   (id: string) => void,
  canManage:  boolean,
  canDelete:  boolean,
): ColumnDef<FundingSource, unknown>[] {
  return [
    {
      id: 'nom',
      accessorKey: 'nom',
      header: 'Source',
      meta: { isSticky: true } as Record<string, unknown>,
      cell: ({ row }) => {
        const { nom, type, contact } = row.original;
        return (
          <div className="flex flex-col gap-0.5 min-w-[200px] max-w-[280px]">
            <span className="text-[13px] font-semibold text-foreground truncate">{nom}</span>
            <span className="text-[10px] text-muted-foreground">{TYPE_LABELS[type]}</span>
            {contact && <span className="text-[11px] text-muted-foreground truncate">{contact}</span>}
          </div>
        );
      },
    },
    {
      accessorKey: 'montant',
      header: 'Montant',
      meta: { align: 'right' } as Record<string, unknown>,
      cell: ({ row }) => (
        <span className="font-mono text-[13px] font-semibold text-foreground">
          {formatMontant(row.original.montant, row.original.devise)}
        </span>
      ),
    },
    {
      accessorKey: 'pourcentage',
      header: '% Contribution',
      cell: ({ getValue }) => {
        const pct = (getValue() as number | null) ?? 0;
        return (
          <div className="flex flex-col gap-1 min-w-[100px]">
            <span className="font-mono text-[12px] font-semibold text-foreground">{pct}%</span>
            <ProgressBar value={pct} size="xs" color="primary" aria-label={`Contribution ${pct}%`} />
          </div>
        );
      },
    },
    {
      accessorKey: 'dateAccord',
      header: 'Accord',
      meta: { align: 'center' } as Record<string, unknown>,
      cell: ({ getValue }) => (
        <span className="font-mono text-[12px] text-muted-foreground">{formatDate(getValue() as string | null)}</span>
      ),
    },
    {
      accessorKey: 'dateExpiry',
      header: 'Expiration',
      meta: { align: 'center' } as Record<string, unknown>,
      cell: ({ getValue }) => {
        const date = getValue() as string | null;
        const expired = isExpired(date);
        const soon    = !expired && isExpiringSoon(date);
        return (
          <span className={`font-mono text-[12px] ${expired ? 'text-destructive font-semibold' : soon ? 'text-warning font-semibold' : 'text-muted-foreground'}`}>
            {formatDate(date)}
          </span>
        );
      },
    },
    {
      id: 'actions',
      enableHiding: false,
      meta: { align: 'right' } as Record<string, unknown>,
      cell: ({ row }) => (
        <div className="flex items-center gap-1 justify-end">
          <Button variant="ghost" size="sm" aria-label="Voir" onClick={() => onView(row.original)}><Eye className="h-3.5 w-3.5" /></Button>
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
// Composant principal
// ─────────────────────────────────────────────────────────────────────────────

export default function ProjectFundingTab() {
  const { id: urlProjectId } = useParams<{ id: string }>();
  const activeProjectId = useUIStore(s => s.activeProjectId);
  const projectId = urlProjectId || activeProjectId || '';

  const { data: sources = [] } = useFundingSources(projectId);
  const createMutation = useCreateFundingSource(projectId);
  const updateMutation = useUpdateFundingSource(projectId);
  const deleteMutation = useDeleteFundingSource(projectId);

  // Miroir des rôles serveur (requireRole) sur funding-sources-create/update
  // (COORDINATEUR/CHARGE_PROGRAMME/FINANCIER/ADMIN/SUPER_ADMIN) et -delete (ADMIN/SUPER_ADMIN).
  const currentRole = useAuthStore(s => s.user?.role);
  const canManage = !!currentRole && ['COORDINATEUR', 'CHARGE_PROGRAMME', 'FINANCIER', 'ADMIN', 'SUPER_ADMIN'].includes(currentRole);
  const canDelete = currentRole === 'ADMIN' || currentRole === 'SUPER_ADMIN';

  const [slideOverOpen,  setSlideOverOpen]  = useState(false);
  const [slideOverMode,  setSlideOverMode]  = useState<SlideOverMode>('new');
  const [selected,       setSelected]       = useState<FundingSource | null>(null);
  const [saveError,      setSaveError]      = useState<string | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [deleteError,    setDeleteError]    = useState<string | null>(null);
  const [exported,       setExported]       = useState(false);

  function extractErrorMessage(err: unknown): string {
    return err instanceof Error ? err.message : 'Une erreur est survenue. Veuillez réessayer.';
  }

  const kpis = useMemo(() => {
    const total     = sources.length;
    const bailleurs = sources.filter(s => s.type === 'BAILLEUR').length;
    const montantTotal = sources.reduce((s, c) => s + c.montant, 0);
    const pctTotal  = Math.round(sources.reduce((s, c) => s + (c.pourcentage ?? 0), 0));
    return { total, bailleurs, montantTotal, pctTotal };
  }, [sources]);

  const pieData = useMemo(() =>
    sources.map((s, i) => ({
      name: s.nom,
      value: s.pourcentage ?? 0,
      color: PIE_COLORS[i % PIE_COLORS.length],
    })),
    [sources]
  );

  const deleteTarget = useMemo(
    () => sources.find(s => s.id === deleteTargetId) ?? null,
    [sources, deleteTargetId],
  );

  function handleSave(data: Partial<FundingSource>) {
    setSaveError(null);
    const onError = (err: unknown) => setSaveError(extractErrorMessage(err));
    if (slideOverMode === 'new') {
      createMutation.mutate(data, { onSuccess: () => setSlideOverOpen(false), onError });
    } else if (slideOverMode === 'edit' && selected) {
      updateMutation.mutate({ id: selected.id, ...data }, { onSuccess: () => setSlideOverOpen(false), onError });
    }
  }

  function handleDeleteConfirm() {
    if (!deleteTargetId) return;
    setDeleteError(null);
    deleteMutation.mutate(deleteTargetId, {
      onSuccess: () => {
        if (selected?.id === deleteTargetId) {
          setSlideOverOpen(false);
          setSelected(null);
        }
        setDeleteTargetId(null);
      },
      onError: (err) => setDeleteError(extractErrorMessage(err)),
    });
  }

  function handleExportCsv() {
    exportCsv(sources);
    setExported(true);
    setTimeout(() => setExported(false), 2500);
  }

  const columns = buildFundingColumns(
    (s) => { setSelected(s); setSlideOverMode('view'); setSlideOverOpen(true); },
    (s) => { setSelected(s); setSlideOverMode('edit'); setSlideOverOpen(true); },
    (id) => { setDeleteTargetId(id); setDeleteError(null); },
    canManage,
    canDelete,
  );

  return (
    <section aria-label="Sources de Financement" className="flex flex-col gap-6">

      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-border">
        <div>
          <h1 className="text-base font-bold text-foreground">Sources de Financement</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Bailleurs, contreparties et répartition des contributions</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-8 text-xs" onClick={handleExportCsv}>
            <Download className="h-3.5 w-3.5 mr-1.5" aria-hidden="true" />
            Exporter CSV
          </Button>
          {canManage && (
            <Button variant="default" size="sm" className="h-8 text-xs" onClick={() => { setSelected(null); setSlideOverMode('new'); setSaveError(null); setSlideOverOpen(true); }}>
              <Plus className="h-3.5 w-3.5 mr-1.5" aria-hidden="true" />
              Nouvelle source
            </Button>
          )}
        </div>
      </div>

      {exported && (
        <div className="flex items-center gap-2 text-success text-xs bg-success/10 border border-success/20 rounded-md px-3 py-2">
          <CheckCircle2 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          Export CSV téléchargé avec succès.
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Sources" value={kpis.total} icon={<Banknote className="h-4 w-4" aria-hidden="true" />} iconVariant="primary" description="Toutes catégories" />
        <StatCard title="Bailleurs" value={kpis.bailleurs} icon={<Users className="h-4 w-4" aria-hidden="true" />} iconVariant="success" description="Partenaires financiers" />
        <StatCard title="Montant total" value={kpis.montantTotal.toLocaleString('fr-FR')} icon={<TrendingUp className="h-4 w-4" aria-hidden="true" />} iconVariant="warning" description="Toutes devises confondues" />
        <StatCard title="% Contribution cumulé" value={`${kpis.pctTotal}%`} icon={<Banknote className="h-4 w-4" aria-hidden="true" />} iconVariant="primary" description="Somme des contributions" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Répartition par source</CardTitle>
          </CardHeader>
          <CardContent>
            <div role="img" aria-label="Graphique de répartition du financement par source" className="h-[220px]">
              {pieData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-sm text-muted-foreground">Aucune source enregistrée</div>
              ) : (
                <ResponsiveContainer width="99%" height="100%">
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value" nameKey="name">
                      {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                    </Pie>
                    <Tooltip content={<FundingTooltip />} />
                    <Legend iconSize={10} iconType="circle" formatter={(v: unknown) => <span className="text-[11px] text-muted-foreground">{v as string}</span>} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Détail des contributions</CardTitle>
          </CardHeader>
          <CardContent>
            {sources.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Aucune source enregistrée.</p>
            ) : (
              <ul role="list" className="flex flex-col gap-4">
                {sources.map((s) => (
                  <li key={s.id} className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-[13px] font-semibold text-foreground truncate">{s.nom}</span>
                        <Badge variant="outline" className="text-[10px] shrink-0">{TYPE_LABELS[s.type]}</Badge>
                      </div>
                      <span className="font-mono text-[13px] font-bold text-foreground shrink-0">{s.pourcentage ?? 0}%</span>
                    </div>
                    <ProgressBar value={s.pourcentage ?? 0} color="primary" size="sm" aria-label={`${s.nom} — ${s.pourcentage ?? 0}% du financement`} />
                    <div className="flex items-center justify-end text-[11px] text-muted-foreground">
                      <span className="font-mono">{formatMontant(s.montant, s.devise)}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Sources de financement</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <DataTable
            columns={columns}
            data={sources}
            searchKey="nom"
            searchPlaceholder="Rechercher une source..."
            filters={[{
              id: 'type',
              title: 'Type',
              options: [
                { label: 'Bailleur',               value: 'BAILLEUR' },
                { label: 'Contrepartie nationale',  value: 'CONTREPARTIE_NATIONALE' },
                { label: 'Autre',                   value: 'AUTRE' },
              ],
            }]}
          />
        </CardContent>
      </Card>

      <FundingSourceModal
        open={slideOverOpen}
        onOpenChange={open => { setSlideOverOpen(open); if (!open) setSaveError(null); }}
        source={selected}
        mode={slideOverMode}
        onSave={handleSave}
        isSaving={createMutation.isPending || updateMutation.isPending}
        error={saveError}
      />

      <DeleteConfirmModal
        source={deleteTarget}
        onConfirm={handleDeleteConfirm}
        onCancel={() => { setDeleteTargetId(null); setDeleteError(null); }}
        isDeleting={deleteMutation.isPending}
        error={deleteError}
      />

    </section>
  );
}
