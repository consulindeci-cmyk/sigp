import { useState, useMemo, useEffect } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import {
  DollarSign, Users, TrendingUp, Plus, Eye, Edit, Trash2,
  X, Download, CheckCircle2, AlertCircle, CalendarDays,
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
  SlideOver, SlideOverContent, SlideOverHeader, SlideOverTitle,
  SlideOverBody, SlideOverFooter, SlideOverClose,
} from '@/components/ui/overlays/SlideOver';
import {
  mockFundingConventions,
  type FundingConvention,
  type ConventionStatus,
  type ConventionType,
  type Devise,
} from '@/mocks/fundingMocks';

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

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
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

function statutVariant(statut: ConventionStatus): 'success' | 'warning' | 'secondary' | 'destructive' {
  switch (statut) {
    case 'Active':          return 'success';
    case 'En négociation':  return 'warning';
    case 'Suspendue':       return 'destructive';
    default:                return 'secondary';
  }
}

function isExpiringSoon(dateStr: string): boolean {
  return new Date(dateStr) < new Date(Date.now() + 180 * 24 * 60 * 60 * 1000);
}

function isExpired(dateStr: string): boolean {
  return new Date(dateStr) < new Date();
}

function exportCsv(conventions: FundingConvention[]) {
  const HEADERS = [
    'Bailleur', 'Référence', 'Intitulé', 'Type', 'Devise',
    'Montant Total', 'Montant Engagé', 'Montant Décaissé',
    '% Contribution', '% Décaissé',
    'Date Signature', 'Date Expiration', 'Statut',
  ];
  const rows = conventions.map(c => [
    c.bailleur, c.refConvention, c.intitule, c.type, c.devise,
    String(c.montantTotal), String(c.montantEngage), String(c.montantDecaisse),
    String(c.pourcentageContribution), String(c.pourcentageDecaissement),
    c.dateSignature, c.dateExpiration, c.statut,
  ]);
  const csv = '﻿' + [HEADERS, ...rows]
    .map(row => row.map(c => `"${String(c).replace(/"/g, '""')}"`).join(';'))
    .join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `conventions-financement-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ─────────────────────────────────────────────────────────────────────────────
// Form state
// ─────────────────────────────────────────────────────────────────────────────

type ConventionFormState = {
  bailleur:              string;
  refConvention:         string;
  intitule:              string;
  type:                  string;
  devise:                string;
  montantTotal:          string;
  montantEngage:         string;
  montantDecaisse:       string;
  dateSignature:         string;
  dateExpiration:        string;
  statut:                string;
  pourcentageContribution: string;
};

const EMPTY_FORM: ConventionFormState = {
  bailleur: '', refConvention: '', intitule: '',
  type: 'Don', devise: 'USD',
  montantTotal: '', montantEngage: '', montantDecaisse: '',
  dateSignature: '', dateExpiration: '',
  statut: 'En négociation',
  pourcentageContribution: '0',
};

function formFromConvention(c: FundingConvention): ConventionFormState {
  return {
    bailleur:                c.bailleur,
    refConvention:           c.refConvention,
    intitule:                c.intitule,
    type:                    c.type,
    devise:                  c.devise,
    montantTotal:            String(c.montantTotal),
    montantEngage:           String(c.montantEngage),
    montantDecaisse:         String(c.montantDecaisse),
    dateSignature:           c.dateSignature,
    dateExpiration:          c.dateExpiration,
    statut:                  c.statut,
    pourcentageContribution: String(c.pourcentageContribution),
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
// SlideOver Convention (view / edit / new)
// ─────────────────────────────────────────────────────────────────────────────

type SlideOverMode = 'view' | 'edit' | 'new';

function ConventionSlideOver({
  open, onOpenChange, convention, mode, onSave,
}: {
  open:         boolean;
  onOpenChange: (open: boolean) => void;
  convention:   FundingConvention | null;
  mode:         SlideOverMode;
  onSave:       (data: Omit<FundingConvention, 'id'>) => void;
}) {
  const titles: Record<SlideOverMode, string> = {
    view: 'Détails de la convention',
    edit: 'Modifier la convention',
    new:  'Nouvelle convention',
  };
  const readOnly = mode === 'view';

  const [form, setForm]     = useState<ConventionFormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      setForm(convention && mode !== 'new' ? formFromConvention(convention) : EMPTY_FORM);
      setErrors({});
    }
  }, [open, convention, mode]);

  function set(field: keyof ConventionFormState, value: string) {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => { const n = { ...prev }; delete n[field]; return n; });
  }

  // Auto-compute pourcentageDecaissement for display
  const autoDecPct = useMemo(() => {
    const total    = Number(form.montantTotal) || 0;
    const decaisse = Number(form.montantDecaisse) || 0;
    if (total <= 0) return 0;
    return Math.round(Math.min(100, (decaisse / total) * 100));
  }, [form.montantTotal, form.montantDecaisse]);

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!form.bailleur.trim())      errs.bailleur      = 'Requis';
    if (!form.refConvention.trim()) errs.refConvention  = 'Requis';
    if (!form.intitule.trim())      errs.intitule       = 'Requis';
    if (!form.dateSignature)        errs.dateSignature  = 'Requis';
    const total    = Number(form.montantTotal);
    const engage   = Number(form.montantEngage) || 0;
    const decaisse = Number(form.montantDecaisse) || 0;
    const contrib  = Number(form.pourcentageContribution) || 0;
    if (isNaN(total) || total <= 0)           errs.montantTotal  = 'Doit être > 0';
    if (engage > total)                       errs.montantEngage = 'Ne peut dépasser le montant total';
    if (decaisse > engage)                    errs.montantDecaisse = 'Ne peut dépasser le montant engagé';
    if (contrib < 0 || contrib > 100)         errs.pourcentageContribution = 'Entre 0 et 100';
    if (form.dateExpiration && form.dateSignature && form.dateExpiration < form.dateSignature)
      errs.dateExpiration = 'Doit être postérieure à la date de signature';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSave() {
    if (!validate()) return;
    const total    = Number(form.montantTotal) || 0;
    const engage   = Number(form.montantEngage) || 0;
    const decaisse = Number(form.montantDecaisse) || 0;
    onSave({
      bailleur:                form.bailleur.trim(),
      refConvention:           form.refConvention.trim(),
      intitule:                form.intitule.trim(),
      type:                    form.type as ConventionType,
      devise:                  form.devise as Devise,
      montantTotal:            total,
      montantEngage:           engage,
      montantDecaisse:         decaisse,
      dateSignature:           form.dateSignature,
      dateExpiration:          form.dateExpiration,
      statut:                  form.statut as ConventionStatus,
      pourcentageContribution: Number(form.pourcentageContribution) || 0,
      pourcentageDecaissement: autoDecPct,
    });
  }

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
          {readOnly && convention ? (
            /* ── Mode lecture ── */
            <div className="flex flex-col gap-5">

              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant={statutVariant(convention.statut)} className="text-[11px]">{convention.statut}</Badge>
                <Badge variant="outline" className="text-[11px]">{convention.type}</Badge>
                <Badge variant="outline" className="font-mono text-[10px]">{convention.devise}</Badge>
              </div>

              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Bailleur</p>
                <p className="text-[15px] font-semibold text-foreground">{convention.bailleur}</p>
                <p className="font-mono text-[11px] text-muted-foreground mt-0.5">{convention.refConvention}</p>
              </div>

              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Intitulé</p>
                <p className="text-[13px] text-foreground leading-relaxed">{convention.intitule}</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-border pt-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Montant total</p>
                  <p className="font-mono text-[14px] font-bold text-foreground">{formatMontant(convention.montantTotal, convention.devise)}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Contribution</p>
                  <p className="font-mono text-[14px] font-bold text-primary">{convention.pourcentageContribution}%</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Engagé</p>
                  <p className="font-mono text-[13px] text-foreground">{formatMontant(convention.montantEngage, convention.devise)}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Décaissé</p>
                  <p className="font-mono text-[13px] text-foreground">{formatMontant(convention.montantDecaisse, convention.devise)}</p>
                </div>
              </div>

              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">Taux de décaissement</p>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] text-muted-foreground">Progression</span>
                  <span className="font-mono text-[13px] font-bold text-foreground">{convention.pourcentageDecaissement}%</span>
                </div>
                <ProgressBar
                  value={convention.pourcentageDecaissement}
                  size="md"
                  color={convention.pourcentageDecaissement >= 70 ? 'success' : convention.pourcentageDecaissement >= 40 ? 'warning' : 'destructive'}
                  aria-label={`Taux de décaissement ${convention.pourcentageDecaissement}%`}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-border pt-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Date de signature</p>
                  <div className="flex items-center gap-1.5">
                    <CalendarDays className="h-3.5 w-3.5 text-muted-foreground shrink-0" aria-hidden="true" />
                    <p className="font-mono text-[13px] text-foreground">{formatDate(convention.dateSignature)}</p>
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Date d'expiration</p>
                  <div className="flex items-center gap-1.5">
                    <CalendarDays className="h-3.5 w-3.5 text-muted-foreground shrink-0" aria-hidden="true" />
                    <p className={`font-mono text-[13px] ${isExpired(convention.dateExpiration) ? 'text-destructive font-semibold' : isExpiringSoon(convention.dateExpiration) ? 'text-warning font-semibold' : 'text-foreground'}`}>
                      {formatDate(convention.dateExpiration)}
                    </p>
                  </div>
                </div>
              </div>

            </div>
          ) : (
            /* ── Mode édition / création — formulaire contrôlé ── */
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <label className="text-sm font-medium text-foreground" htmlFor="conv-bailleur">Bailleur *</label>
                <Input
                  id="conv-bailleur"
                  value={form.bailleur}
                  onChange={e => set('bailleur', e.target.value)}
                  placeholder="Nom du bailleur de fonds"
                  className={errors.bailleur ? 'border-destructive' : ''}
                />
                {errors.bailleur && <p className="text-[11px] text-destructive">{errors.bailleur}</p>}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-foreground" htmlFor="conv-ref">Référence convention *</label>
                <Input
                  id="conv-ref"
                  value={form.refConvention}
                  onChange={e => set('refConvention', e.target.value)}
                  placeholder="AFD-NIG-2024-001"
                  className={errors.refConvention ? 'border-destructive' : ''}
                />
                {errors.refConvention && <p className="text-[11px] text-destructive">{errors.refConvention}</p>}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-foreground" htmlFor="conv-statut">Statut</label>
                <Select id="conv-statut" value={form.statut} onChange={e => set('statut', e.target.value)}>
                  <option value="En négociation">En négociation</option>
                  <option value="Active">Active</option>
                  <option value="Clôturée">Clôturée</option>
                  <option value="Suspendue">Suspendue</option>
                </Select>
              </div>

              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <label className="text-sm font-medium text-foreground" htmlFor="conv-intitule">Intitulé *</label>
                <Textarea
                  id="conv-intitule"
                  value={form.intitule}
                  onChange={e => set('intitule', e.target.value)}
                  placeholder="Intitulé complet de la convention"
                  rows={2}
                  className={errors.intitule ? 'border-destructive' : ''}
                />
                {errors.intitule && <p className="text-[11px] text-destructive">{errors.intitule}</p>}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-foreground" htmlFor="conv-type">Type</label>
                <Select id="conv-type" value={form.type} onChange={e => set('type', e.target.value)}>
                  <option value="Don">Don</option>
                  <option value="Prêt">Prêt</option>
                  <option value="Subvention">Subvention</option>
                  <option value="Contrepartie nationale">Contrepartie nationale</option>
                </Select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-foreground" htmlFor="conv-devise">Devise</label>
                <Select id="conv-devise" value={form.devise} onChange={e => set('devise', e.target.value)}>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="XOF">XOF (FCFA)</option>
                  <option value="GBP">GBP</option>
                </Select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-foreground" htmlFor="conv-montant-total">Montant total *</label>
                <Input
                  id="conv-montant-total"
                  type="number"
                  min={0}
                  value={form.montantTotal}
                  onChange={e => set('montantTotal', e.target.value)}
                  placeholder="0"
                  className={errors.montantTotal ? 'border-destructive' : ''}
                />
                {errors.montantTotal && <p className="text-[11px] text-destructive">{errors.montantTotal}</p>}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-foreground" htmlFor="conv-engage">Montant engagé</label>
                <Input
                  id="conv-engage"
                  type="number"
                  min={0}
                  value={form.montantEngage}
                  onChange={e => set('montantEngage', e.target.value)}
                  placeholder="0"
                  className={errors.montantEngage ? 'border-destructive' : ''}
                />
                {errors.montantEngage && <p className="text-[11px] text-destructive">{errors.montantEngage}</p>}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-foreground" htmlFor="conv-decaisse">Montant décaissé</label>
                <Input
                  id="conv-decaisse"
                  type="number"
                  min={0}
                  value={form.montantDecaisse}
                  onChange={e => set('montantDecaisse', e.target.value)}
                  placeholder="0"
                  className={errors.montantDecaisse ? 'border-destructive' : ''}
                />
                {errors.montantDecaisse && <p className="text-[11px] text-destructive">{errors.montantDecaisse}</p>}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-foreground" htmlFor="conv-contrib">% Contribution</label>
                <Input
                  id="conv-contrib"
                  type="number"
                  min={0}
                  max={100}
                  value={form.pourcentageContribution}
                  onChange={e => set('pourcentageContribution', e.target.value)}
                  placeholder="0"
                  className={errors.pourcentageContribution ? 'border-destructive' : ''}
                />
                {errors.pourcentageContribution && <p className="text-[11px] text-destructive">{errors.pourcentageContribution}</p>}
              </div>

              <div className="flex flex-col gap-1.5 sm:col-span-2 bg-muted/30 rounded-lg p-3 border border-border">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">% Décaissement (calculé automatiquement)</p>
                <div className="flex items-center gap-3 mt-1">
                  <ProgressBar value={autoDecPct} size="sm" color={autoDecPct >= 70 ? 'success' : autoDecPct >= 40 ? 'warning' : 'destructive'} aria-label={`Taux de décaissement ${autoDecPct}%`} />
                  <span className="font-mono text-[14px] font-bold text-foreground shrink-0">{autoDecPct}%</span>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-foreground" htmlFor="conv-signature">Date de signature *</label>
                <Input
                  id="conv-signature"
                  type="date"
                  value={form.dateSignature}
                  onChange={e => set('dateSignature', e.target.value)}
                  className={errors.dateSignature ? 'border-destructive' : ''}
                />
                {errors.dateSignature && <p className="text-[11px] text-destructive">{errors.dateSignature}</p>}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-foreground" htmlFor="conv-expiration">Date d'expiration</label>
                <Input
                  id="conv-expiration"
                  type="date"
                  value={form.dateExpiration}
                  onChange={e => set('dateExpiration', e.target.value)}
                  className={errors.dateExpiration ? 'border-destructive' : ''}
                />
                {errors.dateExpiration && <p className="text-[11px] text-destructive">{errors.dateExpiration}</p>}
              </div>

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
// Modal de confirmation de suppression
// ─────────────────────────────────────────────────────────────────────────────

function DeleteConfirmModal({
  convention, onConfirm, onCancel,
}: {
  convention: FundingConvention | null;
  onConfirm:  () => void;
  onCancel:   () => void;
}) {
  if (!convention) return null;
  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40"
      role="dialog"
      aria-modal="true"
      aria-labelledby="del-conv-modal-title"
    >
      <div className="bg-card border border-border rounded-lg shadow-lg p-6 max-w-sm w-full mx-4 flex flex-col gap-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" aria-hidden="true" />
          <div>
            <h3 id="del-conv-modal-title" className="text-sm font-bold text-foreground">Supprimer la convention</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Supprimer la convention{' '}
              <span className="font-semibold text-foreground">« {convention.bailleur} »</span>{' '}
              ({convention.refConvention}) ? Cette action est irréversible.
            </p>
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onCancel}>Annuler</Button>
          <Button variant="destructive" size="sm" onClick={onConfirm}>Supprimer</Button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Colonnes DataTable
// ─────────────────────────────────────────────────────────────────────────────

function buildConventionColumns(
  onView:   (c: FundingConvention) => void,
  onEdit:   (c: FundingConvention) => void,
  onDelete: (id: string) => void,
): ColumnDef<FundingConvention, unknown>[] {
  return [
    {
      id: 'bailleur',
      accessorKey: 'bailleur',
      header: 'Bailleur & Convention',
      meta: { isSticky: true } as Record<string, unknown>,
      cell: ({ row }) => {
        const { bailleur, refConvention, intitule } = row.original;
        return (
          <div className="flex flex-col gap-0.5 min-w-[220px] max-w-[300px]">
            <span className="text-[13px] font-semibold text-foreground truncate">{bailleur}</span>
            <span className="font-mono text-[10px] text-muted-foreground">{refConvention}</span>
            <span className="text-[11px] text-muted-foreground leading-snug line-clamp-2 whitespace-normal" title={intitule}>
              {intitule}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: 'type',
      header: 'Type',
      cell: ({ getValue }) => (
        <Badge variant="outline" className="text-[11px] w-max">{getValue() as string}</Badge>
      ),
    },
    {
      accessorKey: 'montantTotal',
      header: 'Montant Total',
      meta: { align: 'right' } as Record<string, unknown>,
      cell: ({ row }) => {
        const { montantTotal, devise } = row.original;
        return (
          <span className="font-mono text-[13px] font-semibold text-foreground">
            {formatMontant(montantTotal, devise)}
          </span>
        );
      },
    },
    {
      accessorKey: 'pourcentageContribution',
      header: '% Contribution',
      cell: ({ getValue }) => {
        const pct = getValue() as number;
        return (
          <div className="flex flex-col gap-1 min-w-[100px]">
            <span className="font-mono text-[12px] font-semibold text-foreground">{pct}%</span>
            <ProgressBar value={pct} size="xs" color="primary" aria-label={`Contribution ${pct}%`} />
          </div>
        );
      },
    },
    {
      accessorKey: 'pourcentageDecaissement',
      header: '% Décaissé',
      cell: ({ getValue }) => {
        const pct = getValue() as number;
        const color = pct >= 70 ? 'success' : pct >= 40 ? 'warning' : 'destructive';
        return (
          <div className="flex flex-col gap-1 min-w-[100px]">
            <span className="font-mono text-[12px] font-semibold text-foreground">{pct}%</span>
            <ProgressBar value={pct} size="xs" color={color} aria-label={`Décaissement ${pct}%`} />
          </div>
        );
      },
    },
    {
      accessorKey: 'dateSignature',
      header: 'Signature',
      meta: { align: 'center' } as Record<string, unknown>,
      cell: ({ getValue }) => (
        <span className="font-mono text-[12px] text-muted-foreground">{formatDate(getValue() as string)}</span>
      ),
    },
    {
      accessorKey: 'dateExpiration',
      header: 'Expiration',
      meta: { align: 'center' } as Record<string, unknown>,
      cell: ({ getValue }) => {
        const date = getValue() as string;
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
      accessorKey: 'statut',
      header: 'Statut',
      cell: ({ getValue }) => {
        const s = getValue() as ConventionStatus;
        return <Badge variant={statutVariant(s)} className="text-[11px] w-max">{s}</Badge>;
      },
    },
    {
      id: 'actions',
      enableHiding: false,
      meta: { align: 'right' } as Record<string, unknown>,
      cell: ({ row }) => (
        <div className="flex items-center gap-1 justify-end">
          <Button variant="ghost" size="sm" aria-label="Voir" onClick={() => onView(row.original)}>
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
// Composant principal
// ─────────────────────────────────────────────────────────────────────────────

export default function ProjectFundingTab() {
  const [conventions,    setConventions]    = useState<FundingConvention[]>(mockFundingConventions);
  const [slideOverOpen,  setSlideOverOpen]  = useState(false);
  const [slideOverMode,  setSlideOverMode]  = useState<SlideOverMode>('new');
  const [selected,       setSelected]       = useState<FundingConvention | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [exported,       setExported]       = useState(false);

  // ── KPIs calculés depuis l'état ──────────────────────────────────────────
  const kpis = useMemo(() => {
    const total      = conventions.length;
    const actives    = conventions.filter(c => c.statut === 'Active').length;
    const bailleurs  = new Set(conventions.map(c => c.bailleur)).size;
    const tauxMoyen  = conventions.length > 0
      ? Math.round(
          conventions.reduce((s, c) => s + (c.pourcentageContribution / 100) * c.pourcentageDecaissement, 0)
        )
      : 0;
    return { total, actives, bailleurs, tauxMoyen };
  }, [conventions]);

  // ── Données pie calculées depuis l'état ───────────────────────────────────
  const pieData = useMemo(() =>
    conventions.map((c, i) => ({
      name:  c.bailleur,
      value: c.pourcentageContribution,
      color: PIE_COLORS[i % PIE_COLORS.length],
    })),
    [conventions]
  );

  const deleteTarget = useMemo(
    () => conventions.find(c => c.id === deleteTargetId) ?? null,
    [conventions, deleteTargetId],
  );

  // ── Save (création / modification) ───────────────────────────────────────
  function handleSave(data: Omit<FundingConvention, 'id'>) {
    if (slideOverMode === 'new') {
      const newConvention: FundingConvention = {
        id: `fc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        ...data,
      };
      setConventions(prev => [...prev, newConvention]);
    } else if (slideOverMode === 'edit' && selected) {
      setConventions(prev =>
        prev.map(c => c.id === selected.id ? { ...c, ...data } : c)
      );
    }
    setSlideOverOpen(false);
  }

  // ── Suppression confirmée ─────────────────────────────────────────────────
  function handleDeleteConfirm() {
    if (deleteTargetId) {
      setConventions(prev => prev.filter(c => c.id !== deleteTargetId));
      if (selected?.id === deleteTargetId) {
        setSlideOverOpen(false);
        setSelected(null);
      }
    }
    setDeleteTargetId(null);
  }

  function handleExportCsv() {
    exportCsv(conventions);
    setExported(true);
    setTimeout(() => setExported(false), 2500);
  }

  const columns = buildConventionColumns(
    (c) => { setSelected(c); setSlideOverMode('view'); setSlideOverOpen(true); },
    (c) => { setSelected(c); setSlideOverMode('edit'); setSlideOverOpen(true); },
    (id) => setDeleteTargetId(id),
  );

  return (
    <section aria-label="Sources de Financement & Conventions" className="flex flex-col gap-6">

      {/* ── HEADER ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-border">
        <div>
          <h1 className="text-base font-bold text-foreground">Financement &amp; Conventions</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Sources de financement, conventions bailleurs et taux de décaissement
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-8 text-xs" onClick={handleExportCsv}>
            <Download className="h-3.5 w-3.5 mr-1.5" aria-hidden="true" />
            Exporter CSV
          </Button>
          <Button
            variant="default" size="sm" className="h-8 text-xs"
            onClick={() => { setSelected(null); setSlideOverMode('new'); setSlideOverOpen(true); }}
          >
            <Plus className="h-3.5 w-3.5 mr-1.5" aria-hidden="true" />
            Nouvelle convention
          </Button>
        </div>
      </div>

      {/* ── Feedback export ───────────────────────────────────────────────── */}
      {exported && (
        <div className="flex items-center gap-2 text-success text-xs bg-success/10 border border-success/20 rounded-md px-3 py-2">
          <CheckCircle2 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          Export CSV téléchargé avec succès.
        </div>
      )}

      {/* ── KPI Strip (calculés depuis l'état) ───────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Conventions"
          value={kpis.total}
          icon={<DollarSign className="h-4 w-4" aria-hidden="true" />}
          iconVariant="primary"
          description={`${kpis.actives} active${kpis.actives > 1 ? 's' : ''}`}
        />
        <StatCard
          title="Bailleurs"
          value={kpis.bailleurs}
          icon={<Users className="h-4 w-4" aria-hidden="true" />}
          iconVariant="success"
          description="Partenaires financiers"
        />
        <StatCard
          title="Conventions actives"
          value={kpis.actives}
          icon={<CheckCircle2 className="h-4 w-4" aria-hidden="true" />}
          iconVariant="success"
          description={`Sur ${kpis.total} convention${kpis.total > 1 ? 's' : ''}`}
        />
        <StatCard
          title="Taux décaissement"
          value={`${kpis.tauxMoyen}%`}
          icon={<TrendingUp className="h-4 w-4" aria-hidden="true" />}
          iconVariant="warning"
          description="Moyenne pondérée"
        />
      </div>

      {/* ── Chart + Contributions ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Pie chart — calculé depuis l'état */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Répartition par bailleur</CardTitle>
          </CardHeader>
          <CardContent>
            <div
              role="img"
              aria-label="Graphique de répartition du financement par bailleur"
              className="h-[220px]"
            >
              {pieData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
                  Aucune convention enregistrée
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={3}
                      dataKey="value"
                      nameKey="name"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<FundingTooltip />} />
                    <Legend
                      iconSize={10}
                      iconType="circle"
                      formatter={(v: unknown) => (
                        <span className="text-[11px] text-muted-foreground">{v as string}</span>
                      )}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Contributions — depuis l'état */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Détail des contributions</CardTitle>
          </CardHeader>
          <CardContent>
            {conventions.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Aucune convention enregistrée.</p>
            ) : (
              <ul role="list" className="flex flex-col gap-4">
                {conventions.map((conv) => (
                  <li key={conv.id} className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-[13px] font-semibold text-foreground truncate">{conv.bailleur}</span>
                        <Badge variant={statutVariant(conv.statut)} className="text-[10px] shrink-0">{conv.statut}</Badge>
                      </div>
                      <span className="font-mono text-[13px] font-bold text-foreground shrink-0">
                        {conv.pourcentageContribution}%
                      </span>
                    </div>
                    <ProgressBar
                      value={conv.pourcentageContribution}
                      color="primary"
                      size="sm"
                      aria-label={`${conv.bailleur} — ${conv.pourcentageContribution}% du financement`}
                    />
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <span className="font-mono">{formatMontant(conv.montantDecaisse, conv.devise)}</span>
                        <span>décaissé sur</span>
                        <span className="font-mono">{formatMontant(conv.montantTotal, conv.devise)}</span>
                      </span>
                      <span className="font-mono font-semibold">{conv.pourcentageDecaissement}% décaissé</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── DataTable conventions ─────────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-base">Conventions de financement</CardTitle>
          <Button
            variant="default" size="sm"
            onClick={() => { setSelected(null); setSlideOverMode('new'); setSlideOverOpen(true); }}
          >
            <Plus className="h-4 w-4 mr-1.5" aria-hidden="true" />
            Ajouter
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <DataTable
            columns={columns}
            data={conventions}
            searchKey="bailleur"
            searchPlaceholder="Rechercher un bailleur..."
            filters={[
              {
                id: 'type',
                title: 'Type de convention',
                options: [
                  { label: 'Prêt',                  value: 'Prêt'                  },
                  { label: 'Don',                   value: 'Don'                   },
                  { label: 'Subvention',            value: 'Subvention'            },
                  { label: 'Contrepartie nationale', value: 'Contrepartie nationale' },
                ],
              },
              {
                id: 'statut',
                title: 'Statut',
                options: [
                  { label: 'Active',          value: 'Active'          },
                  { label: 'En négociation',  value: 'En négociation'  },
                  { label: 'Clôturée',        value: 'Clôturée'        },
                  { label: 'Suspendue',       value: 'Suspendue'       },
                ],
              },
            ]}
          />
        </CardContent>
      </Card>

      {/* ── SlideOver ─────────────────────────────────────────────────────── */}
      <ConventionSlideOver
        open={slideOverOpen}
        onOpenChange={setSlideOverOpen}
        convention={selected}
        mode={slideOverMode}
        onSave={handleSave}
      />

      {/* ── Modal suppression ─────────────────────────────────────────────── */}
      <DeleteConfirmModal
        convention={deleteTarget}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTargetId(null)}
      />

    </section>
  );
}
