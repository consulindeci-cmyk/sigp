import { ColumnDef } from '@tanstack/react-table';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { DollarSign, Users, TrendingUp, Wallet } from 'lucide-react';
import { DataTable } from '@/components/ui/data-table/DataTable';
import { Badge } from '@/components/ui/data-display/Badge';
import { StatCard } from '@/components/ui/data-display/StatCard';
import { ProgressBar } from '@/components/ui/data-display/ProgressBar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/data-display/Card';
import {
  mockFundingConventions,
  mockFundingKPIs,
  mockFundingPieData,
  type FundingConvention,
  type ConventionStatus,
} from '@/mocks/fundingMocks';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
    });
  } catch {
    return '—';
  }
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

const tooltipStyle = {
  backgroundColor: 'var(--card)',
  border: '1px solid var(--border)',
  borderRadius: '8px',
  color: 'var(--foreground)',
  fontSize: '12px',
};

// ─────────────────────────────────────────────────────────────────────────────
// Column definitions
// ─────────────────────────────────────────────────────────────────────────────

function buildConventionColumns(): ColumnDef<FundingConvention, any>[] {
  return [
    {
      id: 'bailleur',
      accessorKey: 'bailleur',
      header: 'Bailleur & Convention',
      meta: { isSticky: true } as any,
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
      meta: { align: 'right' } as any,
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
      meta: { align: 'center' } as any,
      cell: ({ getValue }) => (
        <span className="font-mono text-[12px] text-muted-foreground">
          {formatDate(getValue() as string)}
        </span>
      ),
    },
    {
      accessorKey: 'dateExpiration',
      header: 'Expiration',
      meta: { align: 'center' } as any,
      cell: ({ getValue }) => {
        const date = getValue() as string;
        const isExpiringSoon = new Date(date) < new Date(Date.now() + 180 * 24 * 60 * 60 * 1000);
        const isExpired = new Date(date) < new Date();
        return (
          <span className={`font-mono text-[12px] ${isExpired ? 'text-destructive font-semibold' : isExpiringSoon ? 'text-warning font-semibold' : 'text-muted-foreground'}`}>
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
  ];
}

// ─────────────────────────────────────────────────────────────────────────────
// Chart tooltip
// ─────────────────────────────────────────────────────────────────────────────

function FundingTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const { name, value } = payload[0];
  return (
    <div style={tooltipStyle} className="px-3 py-2 shadow-md">
      <p className="font-semibold text-foreground text-[13px]">{name}</p>
      <p className="text-muted-foreground text-[12px]">{value}% du financement</p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main export
// ─────────────────────────────────────────────────────────────────────────────

export default function ProjectFundingTab() {
  const conventionColumns = buildConventionColumns();

  return (
    <section aria-label="Sources de Financement & Conventions" className="flex flex-col gap-6">

      {/* KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Montant Total"
          value={mockFundingKPIs.montantTotal}
          icon={<DollarSign className="h-4 w-4 text-primary" aria-hidden="true" />}
          iconVariant="primary"
          description="Toutes sources confondues"
        />
        <StatCard
          title="Nombre de Bailleurs"
          value={mockFundingKPIs.nombreBailleurs}
          icon={<Users className="h-4 w-4 text-success" aria-hidden="true" />}
          iconVariant="success"
          description="Bailleurs actifs"
        />
        <StatCard
          title="Montant Engagé"
          value={mockFundingKPIs.montantEngage}
          icon={<TrendingUp className="h-4 w-4 text-warning" aria-hidden="true" />}
          iconVariant="warning"
          description="Sur le montant total"
        />
        <StatCard
          title="Montant Décaissé"
          value={mockFundingKPIs.montantDecaisse}
          icon={<Wallet className="h-4 w-4 text-primary" aria-hidden="true" />}
          iconVariant="primary"
          trend={{
            value: mockFundingKPIs.tauxDecaissement,
            label: 'taux de décaissement',
            isPositive: true,
            unit: '%',
          }}
        />
      </div>

      {/* Chart + Summary row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Pie chart */}
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
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={mockFundingPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                    nameKey="name"
                  >
                    {mockFundingPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<FundingTooltip />} />
                  <Legend
                    iconSize={10}
                    iconType="circle"
                    formatter={(v: any) => (
                      <span className="text-[11px] text-muted-foreground">{v}</span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Contribution breakdown list */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Détail des contributions</CardTitle>
          </CardHeader>
          <CardContent>
            <ul role="list" className="flex flex-col gap-4">
              {mockFundingConventions.map((conv) => (
                <li key={conv.id} className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-[13px] font-semibold text-foreground truncate">
                        {conv.bailleur}
                      </span>
                      <Badge variant={statutVariant(conv.statut)} className="text-[10px] shrink-0">
                        {conv.statut}
                      </Badge>
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
          </CardContent>
        </Card>
      </div>

      {/* Conventions DataTable */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Conventions de financement</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <DataTable
            columns={conventionColumns}
            data={mockFundingConventions}
            searchKey="bailleur"
            searchPlaceholder="Rechercher un bailleur..."
            filters={[
              {
                id: 'type',
                title: 'Type de convention',
                options: [
                  { label: 'Prêt', value: 'Prêt' },
                  { label: 'Don', value: 'Don' },
                  { label: 'Subvention', value: 'Subvention' },
                  { label: 'Contrepartie nationale', value: 'Contrepartie nationale' },
                ],
              },
              {
                id: 'statut',
                title: 'Statut',
                options: [
                  { label: 'Active', value: 'Active' },
                  { label: 'En négociation', value: 'En négociation' },
                  { label: 'Clôturée', value: 'Clôturée' },
                  { label: 'Suspendue', value: 'Suspendue' },
                ],
              },
            ]}
          />
        </CardContent>
      </Card>
    </section>
  );
}
