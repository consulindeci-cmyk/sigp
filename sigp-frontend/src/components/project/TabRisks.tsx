import { useMemo } from 'react';
import { DataTable } from '@/components/ui/data-table/DataTable';
import { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/data-display/Badge';
import { Button } from '@/components/ui/forms/Button';
import { Plus } from 'lucide-react';

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
  // Add more mock data if necessary or keep it as the single row
];

export default function TabRisks() {
  const columns = useMemo<ColumnDef<Risk>[]>(() => [
    {
      accessorKey: 'name',
      header: 'RISQUE',
      cell: ({ row }) => <span className="font-medium">{row.getValue('name')}</span>,
    },
    {
      accessorKey: 'category',
      header: 'CATÉGORIE',
    },
    {
      accessorKey: 'probability',
      header: 'PROBABILITÉ',
    },
    {
      accessorKey: 'impact',
      header: 'IMPACT',
    },
    {
      accessorKey: 'criticality',
      header: 'CRITICITÉ',
      cell: ({ row }) => {
        const crit = row.getValue('criticality') as RiskCriticality;
        let variant: 'default' | 'success' | 'warning' | 'destructive' = 'default';
        if (crit === 'Critique') variant = 'destructive';
        if (crit === 'Modéré') variant = 'warning';
        if (crit === 'Faible') variant = 'success';
        
        return <Badge variant={variant}>{crit}</Badge>;
      },
    },
    {
      accessorKey: 'owner',
      header: 'PROPRIÉTAIRE',
    },
    {
      accessorKey: 'mitigation',
      header: 'PLAN D\'ATTÉNUATION',
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
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-foreground">Registre des Risques</h2>
        <Button variant="default" className="gap-2">
          <Plus className="h-4 w-4" />
          Nouveau Risque
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-background rounded-lg border border-border p-5 shadow-sm">
          <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Total des Risques</div>
          <div className="text-3xl font-semibold text-foreground">11</div>
        </div>
        <div className="bg-background rounded-lg border border-border p-5 shadow-sm">
          <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Critiques</div>
          <div className="text-3xl font-semibold text-destructive">3</div>
        </div>
        <div className="bg-background rounded-lg border border-border p-5 shadow-sm">
          <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Modérés</div>
          <div className="text-3xl font-semibold text-warning">5</div>
        </div>
        <div className="bg-background rounded-lg border border-border p-5 shadow-sm">
          <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Faibles</div>
          <div className="text-3xl font-semibold text-success">3</div>
        </div>
      </div>

      {/* Matrices / Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-background rounded-lg border border-border flex flex-col shadow-sm">
          <div className="px-5 py-4 border-b border-border">
            <h3 className="font-semibold text-foreground">Matrice des Risques</h3>
            <p className="text-xs text-muted-foreground">Probabilité × Impact</p>
          </div>
          <div className="p-5 flex-1 flex items-center justify-center bg-muted/30 rounded-b-lg min-h-[12rem]">
            <span className="text-sm text-muted-foreground">Heatmap des Risques</span>
          </div>
        </div>
        
        <div className="bg-background rounded-lg border border-border flex flex-col shadow-sm">
          <div className="px-5 py-4 border-b border-border">
            <h3 className="font-semibold text-foreground">Suivi</h3>
            <p className="text-xs text-muted-foreground">Aperçu des statuts</p>
          </div>
          <div className="p-5 flex-1 flex items-center justify-center bg-muted/30 rounded-b-lg min-h-[12rem]">
            <span className="text-sm text-muted-foreground">Graphe de suivi</span>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-background rounded-lg border border-border shadow-sm flex flex-col">
        <div className="px-5 py-4 border-b border-border">
          <h3 className="font-semibold text-foreground">Registre des Risques</h3>
        </div>
        <div className="p-5">
          <DataTable 
            columns={columns} 
            data={MOCK_RISKS} 
          />
        </div>
      </div>
    </div>
  );
}
