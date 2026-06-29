import { useMemo } from 'react';
import { DataTable } from '@/components/ui/data-table/DataTable';
import { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/data-display/Badge';
import { StatCard } from '@/components/ui/data-display/StatCard';
import { Button } from '@/components/ui/forms/Button';
import { Plus, ShieldAlert, ShieldCheck, AlertTriangle, Activity } from 'lucide-react';

// ---------------------------------------------------------------------------
// Types & Mock Data
// ---------------------------------------------------------------------------
type RiskCriticality = 'Critique' | 'Modéré' | 'Faible';
type RiskStatus = 'Surveillance accrue' | 'Maîtrisé' | 'Clos';

interface Risk {
  id: string;
  name: string;
  category: string;
  probability: string;
  impact: string;
  criticality: RiskCriticality;
  owner: string;
  mitigation: string;
  status: RiskStatus;
}

const MOCK_RISKS: Risk[] = [
  {
    id: 'R-01',
    name: 'Retard de livraison des transformateurs',
    category: "Chaîne d'approvisionnement",
    probability: 'Élevée',
    impact: 'Majeur',
    criticality: 'Critique',
    owner: 'Équipe Achats',
    mitigation: 'Sourcer des fournisseurs alternatifs régionaux',
    status: 'Surveillance accrue',
  },
];

export default function TabRisks() {
  const columns = useMemo<ColumnDef<Risk>[]>(() => [
    {
      accessorKey: 'name',
      header: 'RISQUE',
      cell: ({ row }) => <span className="font-medium text-foreground">{row.getValue('name')}</span>,
    },
    {
      accessorKey: 'category',
      header: 'CATÉGORIE',
      cell: ({ getValue }) => <span className="text-muted-foreground">{getValue() as string}</span>,
    },
    {
      accessorKey: 'probability',
      header: 'PROBABILITÉ',
      cell: ({ getValue }) => <span className="text-sm text-foreground">{getValue() as string}</span>,
    },
    {
      accessorKey: 'impact',
      header: 'IMPACT',
      cell: ({ getValue }) => <span className="text-sm text-foreground">{getValue() as string}</span>,
    },
    {
      accessorKey: 'criticality',
      header: 'CRITICITÉ',
      cell: ({ row }) => {
        const crit = row.getValue('criticality') as RiskCriticality;
        let variant: 'default' | 'success' | 'warning' | 'destructive' = 'default';
        if (crit === 'Critique') variant = 'destructive';
        if (crit === 'Modéré')   variant = 'warning';
        if (crit === 'Faible')   variant = 'success';
        return <Badge variant={variant}>{crit}</Badge>;
      },
    },
    {
      accessorKey: 'owner',
      header: 'PROPRIÉTAIRE',
      cell: ({ getValue }) => <span className="text-sm text-muted-foreground">{getValue() as string}</span>,
    },
    {
      accessorKey: 'mitigation',
      header: "PLAN D'ATTÉNUATION",
      cell: ({ getValue }) => <span className="text-xs text-foreground">{getValue() as string}</span>,
    },
    {
      accessorKey: 'status',
      header: 'STATUT',
      cell: ({ row }) => {
        const status = row.getValue('status') as RiskStatus;
        let variant: 'default' | 'outline' | 'secondary' = 'outline';
        if (status === 'Surveillance accrue') variant = 'default';
        if (status === 'Clos') variant = 'secondary';
        return <Badge variant={variant}>{status}</Badge>;
      },
    },
  ], []);

  return (
    <div className="flex flex-col gap-4 bg-background">

      {/* ── HEADER ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-border">
        <div>
          <h1 className="text-base font-bold text-foreground">Registre des Risques</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Suivi de la probabilité, de l'impact et des plans d'atténuation</p>
        </div>
        <Button variant="default" size="sm" leftIcon={<Plus className="h-3.5 w-3.5" />} className="h-8 text-xs">
          Nouveau Risque
        </Button>
      </div>

      {/* ── KPI STRIP ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard
          title="Total des Risques"
          value={11}
          icon={<Activity className="h-4 w-4" />}
          iconVariant="info"
          description="risques identifiés"
        />
        <StatCard
          title="Critiques"
          value={3}
          icon={<ShieldAlert className="h-4 w-4" />}
          iconVariant="destructive"
          description="action immédiate"
        />
        <StatCard
          title="Modérés"
          value={5}
          icon={<AlertTriangle className="h-4 w-4" />}
          iconVariant="warning"
          description="surveillance renforcée"
        />
        <StatCard
          title="Faibles"
          value={3}
          icon={<ShieldCheck className="h-4 w-4" />}
          iconVariant="success"
          description="sous contrôle"
        />
      </div>

      {/* ── MATRICES ─────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-card rounded-lg border border-border flex flex-col">
          <div className="px-4 py-3 border-b border-border">
            <h3 className="text-sm font-semibold text-foreground">Matrice des Risques</h3>
            <p className="text-xs text-muted-foreground">Probabilité × Impact</p>
          </div>
          <div className="p-4 flex-1 flex items-center justify-center bg-muted/10 rounded-b-lg min-h-[10rem]">
            <span className="text-sm text-muted-foreground">Heatmap des Risques</span>
          </div>
        </div>
        <div className="bg-card rounded-lg border border-border flex flex-col">
          <div className="px-4 py-3 border-b border-border">
            <h3 className="text-sm font-semibold text-foreground">Suivi des Statuts</h3>
            <p className="text-xs text-muted-foreground">Aperçu de l'évolution</p>
          </div>
          <div className="p-4 flex-1 flex items-center justify-center bg-muted/10 rounded-b-lg min-h-[10rem]">
            <span className="text-sm text-muted-foreground">Graphe de suivi</span>
          </div>
        </div>
      </div>

      {/* ── TABLE ────────────────────────────────────────────────────────────── */}
      <div className="bg-card rounded-lg border border-border flex flex-col">
        <div className="px-4 py-3 border-b border-border">
          <h3 className="text-sm font-semibold text-foreground">Registre Détaillé</h3>
        </div>
        <div className="p-4">
          <DataTable columns={columns} data={MOCK_RISKS} />
        </div>
      </div>
    </div>
  );
}
