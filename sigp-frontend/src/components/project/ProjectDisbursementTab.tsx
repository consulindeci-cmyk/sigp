import { useState } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { Wallet, TrendingUp, Clock, AlertTriangle, Plus, Eye, Edit, Trash2, X } from 'lucide-react';
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
  mockDisbursementRecords,
  mockDisbursementKPIs,
  mockDisbursementChart,
  type DisbursementRecord,
  type DisbursementStatus,
  type DisbursementDevise,
} from '@/mocks/disbursementMocks';

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const CHART_COLORS = {
  prevu:  'var(--muted-foreground, #94a3b8)',
  recu:   'var(--primary, #2563eb)',
};

const tooltipStyle = {
  backgroundColor: 'var(--card)',
  border: '1px solid var(--border)',
  borderRadius: '8px',
  color: 'var(--foreground)',
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
  } catch {
    return '—';
  }
}

function formatMontant(value: number, devise: DisbursementDevise): string {
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

function statutVariant(statut: DisbursementStatus): 'success' | 'warning' | 'secondary' | 'destructive' {
  switch (statut) {
    case 'Reçu':       return 'success';
    case 'En attente': return 'warning';
    case 'Planifié':   return 'secondary';
    case 'En retard':  return 'destructive';
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// SlideOver — Voir / Ajouter / Modifier
// ─────────────────────────────────────────────────────────────────────────────

type SlideOverMode = 'view' | 'edit' | 'new';

function DisbursementSlideOver({
  open, onOpenChange, record, mode,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  record: DisbursementRecord | null;
  mode: SlideOverMode;
}) {
  const titles: Record<SlideOverMode, string> = {
    view: 'Détails du décaissement',
    edit: 'Modifier le décaissement',
    new:  'Nouveau décaissement',
  };
  const readOnly = mode === 'view';

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
            <div className="flex flex-col gap-5">
              {/* Status + Reference header */}
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

              {/* Montants */}
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

              {/* Dates */}
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <label className="text-sm font-medium text-foreground" htmlFor="dis-bailleur">Bailleur</label>
                <Input id="dis-bailleur" defaultValue={record?.bailleur ?? ''} placeholder="Nom du bailleur" />
              </div>
              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <label className="text-sm font-medium text-foreground" htmlFor="dis-convention">Convention</label>
                <Input id="dis-convention" defaultValue={record?.convention ?? ''} placeholder="Réf. convention" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-foreground" htmlFor="dis-ref">Référence</label>
                <Input id="dis-ref" defaultValue={record?.reference ?? ''} placeholder="DEC-XXX-XXXX" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-foreground" htmlFor="dis-tranche">Tranche</label>
                <Input id="dis-tranche" defaultValue={record?.tranche ?? ''} placeholder="Tranche 1" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-foreground" htmlFor="dis-prevu">Montant prévu</label>
                <Input id="dis-prevu" type="number" defaultValue={record?.montantPrevu ?? ''} placeholder="0" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-foreground" htmlFor="dis-recu">Montant reçu</label>
                <Input id="dis-recu" type="number" defaultValue={record?.montantRecu ?? ''} placeholder="0" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-foreground" htmlFor="dis-devise">Devise</label>
                <Select id="dis-devise" defaultValue={record?.devise ?? 'USD'}>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="XOF">XOF</option>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-foreground" htmlFor="dis-statut">Statut</label>
                <Select id="dis-statut" defaultValue={record?.statut ?? 'Planifié'}>
                  <option value="Planifié">Planifié</option>
                  <option value="En attente">En attente</option>
                  <option value="Reçu">Reçu</option>
                  <option value="En retard">En retard</option>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-foreground" htmlFor="dis-datep">Date prévue</label>
                <Input id="dis-datep" type="date" defaultValue={record?.datePrevue ?? ''} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-foreground" htmlFor="dis-dater">Date de réception</label>
                <Input id="dis-dater" type="date" defaultValue={record?.dateReception ?? ''} />
              </div>
            </div>
          )}
        </SlideOverBody>

        <SlideOverFooter>
          <SlideOverClose asChild>
            <Button variant="outline">{readOnly ? 'Fermer' : 'Annuler'}</Button>
          </SlideOverClose>
          {!readOnly && (
            <SlideOverClose asChild>
              <Button variant="default">{mode === 'edit' ? 'Enregistrer' : 'Ajouter'}</Button>
            </SlideOverClose>
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
  onView: (r: DisbursementRecord) => void,
  onEdit: (r: DisbursementRecord) => void,
  onDelete: (id: string) => void,
): ColumnDef<DisbursementRecord, any>[] {
  return [
    {
      id: 'identification',
      accessorKey: 'reference',
      header: 'Référence & Bailleur',
      meta: { isSticky: true } as any,
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
      meta: { align: 'right' } as any,
      cell: ({ row }) => (
        <span className="font-mono text-[12px] text-muted-foreground">
          {formatMontant(row.original.montantPrevu, row.original.devise)}
        </span>
      ),
    },
    {
      accessorKey: 'montantRecu',
      header: 'Montant reçu',
      meta: { align: 'right' } as any,
      cell: ({ row }) => (
        <span className={`font-mono text-[12px] font-semibold ${row.original.montantRecu > 0 ? 'text-success' : 'text-muted-foreground'}`}>
          {formatMontant(row.original.montantRecu, row.original.devise)}
        </span>
      ),
    },
    {
      accessorKey: 'solde',
      header: 'Solde',
      meta: { align: 'right' } as any,
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
      meta: { align: 'center' } as any,
      cell: ({ getValue }) => (
        <span className="font-mono text-[12px] text-muted-foreground">{formatDate(getValue() as string)}</span>
      ),
    },
    {
      accessorKey: 'dateReception',
      header: 'Réception',
      meta: { align: 'center' } as any,
      cell: ({ getValue }) => (
        <span className="font-mono text-[12px] text-muted-foreground">{formatDate(getValue() as string | null)}</span>
      ),
    },
    {
      accessorKey: 'devise',
      header: 'Devise',
      meta: { align: 'center' } as any,
      cell: ({ getValue }) => (
        <span className="font-mono text-[11px] font-bold bg-muted text-muted-foreground px-1.5 py-0.5 rounded">
          {getValue() as string}
        </span>
      ),
    },
    {
      id: 'actions',
      enableHiding: false,
      meta: { align: 'right' } as any,
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
  const [slideOverOpen, setSlideOverOpen] = useState(false);
  const [slideOverMode, setSlideOverMode] = useState<SlideOverMode>('new');
  const [selectedRecord, setSelectedRecord] = useState<DisbursementRecord | null>(null);

  const columns = buildDisbursementColumns(
    (r) => { setSelectedRecord(r); setSlideOverMode('view'); setSlideOverOpen(true); },
    (r) => { setSelectedRecord(r); setSlideOverMode('edit'); setSlideOverOpen(true); },
    (id) => setRecords((prev) => prev.filter((r) => r.id !== id)),
  );

  return (
    <section aria-label="Suivi des Décaissements" className="flex flex-col gap-6">

      {/* KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Montant Total Prévu"
          value={mockDisbursementKPIs.montantTotalPrevu}
          icon={<TrendingUp className="h-4 w-4 text-primary" aria-hidden="true" />}
          iconVariant="primary"
          description="Toutes tranches confondues"
        />
        <StatCard
          title="Montant Reçu"
          value={mockDisbursementKPIs.montantTotalRecu}
          icon={<Wallet className="h-4 w-4 text-success" aria-hidden="true" />}
          iconVariant="success"
          trend={{
            value: mockDisbursementKPIs.tauxDecaissement,
            label: 'taux de décaissement',
            isPositive: true,
            unit: '%',
          }}
        />
        <StatCard
          title="En Attente"
          value={mockDisbursementKPIs.nombreEnAttente}
          icon={<Clock className="h-4 w-4 text-warning" aria-hidden="true" />}
          iconVariant="warning"
          description={`${mockDisbursementKPIs.nombreRecu} décaissements reçus`}
        />
        <StatCard
          title="En Retard"
          value={mockDisbursementKPIs.nombreEnRetard}
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
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mockDisbursementChart} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradPrevu" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={CHART_COLORS.prevu} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={CHART_COLORS.prevu} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradRecu" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={CHART_COLORS.recu} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={CHART_COLORS.recu} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="mois" tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(v: any) => [`${v}M USD éq.`, undefined]}
                />
                <Legend
                  iconType="circle"
                  iconSize={8}
                  formatter={(v: any) => <span className="text-[11px] text-muted-foreground">{v}</span>}
                />
                <Area
                  type="monotone"
                  dataKey="prevu"
                  name="Prévu"
                  stroke={CHART_COLORS.prevu}
                  fill="url(#gradPrevu)"
                  strokeWidth={2}
                  dot={false}
                />
                <Area
                  type="monotone"
                  dataKey="recu"
                  name="Reçu"
                  stroke={CHART_COLORS.recu}
                  fill="url(#gradRecu)"
                  strokeWidth={2}
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* DataTable */}
      <Card>
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-base">Registre des décaissements</CardTitle>
          <Button
            variant="default" size="sm" aria-label="Ajouter un décaissement"
            onClick={() => { setSelectedRecord(null); setSlideOverMode('new'); setSlideOverOpen(true); }}
          >
            <Plus className="h-4 w-4 mr-1.5" aria-hidden="true" />
            Ajouter
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <DataTable
            columns={columns}
            data={records}
            searchKey="reference"
            searchPlaceholder="Rechercher par référence..."
            filters={[
              {
                id: 'statut',
                title: 'Statut',
                options: [
                  { label: 'Reçu', value: 'Reçu' },
                  { label: 'En attente', value: 'En attente' },
                  { label: 'Planifié', value: 'Planifié' },
                  { label: 'En retard', value: 'En retard' },
                ],
              },
              {
                id: 'devise',
                title: 'Devise',
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

      {/* SlideOver */}
      <DisbursementSlideOver
        open={slideOverOpen}
        onOpenChange={setSlideOverOpen}
        record={selectedRecord}
        mode={slideOverMode}
      />
    </section>
  );
}
