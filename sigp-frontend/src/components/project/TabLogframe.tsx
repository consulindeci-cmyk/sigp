import { useMemo } from 'react';
import { DataTable } from '@/components/ui/data-table/DataTable';
import { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/data-display/Badge';
import { Button } from '@/components/ui/forms/Button';
import { Download, Plus } from 'lucide-react';

// ---------------------------------------------------------------------------
// Types & Mock Data
// ---------------------------------------------------------------------------
type LogframeLevel = 'Impact' | 'Effet' | 'Produit' | 'Activité';
type RiskLevel = 'Faible' | 'Modéré' | 'Élevé' | 'Critique';

interface LogframeItem {
  id: string;
  level: LogframeLevel;
  indicator: string;
  baseline: string;
  target: string;
  verificationSource: string;
  assumptions: string;
  risk: RiskLevel;
}

const MOCK_LOGFRAME: LogframeItem[] = [
  {
    id: 'LF-01',
    level: 'Impact',
    indicator: 'Taux d\'accès à l\'électricité en milieu rural',
    baseline: '12% (2022)',
    target: '25% (2026)',
    verificationSource: 'Rapports nationaux d\'énergie',
    assumptions: 'Stabilité macro-économique',
    risk: 'Faible',
  },
  {
    id: 'LF-02',
    level: 'Effet',
    indicator: 'Nombre de foyers raccordés',
    baseline: '0',
    target: '50,000',
    verificationSource: 'Rapports d\'opérateurs',
    assumptions: 'Abonnements abordables',
    risk: 'Modéré',
  },
];

export default function TabLogframe() {
  const columns = useMemo<ColumnDef<LogframeItem>[]>(() => [
    {
      accessorKey: 'level',
      header: 'NIVEAU',
      cell: ({ row }) => {
        const level = row.getValue('level') as LogframeLevel;
        let variant: 'default' | 'success' | 'warning' | 'info' = 'default';
        if (level === 'Impact') variant = 'default';
        if (level === 'Effet') variant = 'info';
        if (level === 'Produit') variant = 'success';
        if (level === 'Activité') variant = 'warning';
        
        return <Badge variant={variant}>{level}</Badge>;
      },
    },
    {
      accessorKey: 'indicator',
      header: 'INDICATEUR',
      cell: ({ row }) => <span className="font-medium">{row.getValue('indicator')}</span>,
    },
    {
      accessorKey: 'baseline',
      header: 'RÉFÉRENCE (BASELINE)',
    },
    {
      accessorKey: 'target',
      header: 'CIBLE',
    },
    {
      accessorKey: 'verificationSource',
      header: 'SOURCE DE VÉRIFICATION',
    },
    {
      accessorKey: 'assumptions',
      header: 'HYPOTHÈSES',
    },
    {
      accessorKey: 'risk',
      header: 'RISQUES',
      cell: ({ row }) => {
        const risk = row.getValue('risk') as RiskLevel;
        let variant: 'default' | 'success' | 'warning' | 'destructive' = 'default';
        if (risk === 'Faible') variant = 'success';
        if (risk === 'Modéré') variant = 'warning';
        if (risk === 'Élevé') variant = 'destructive';
        if (risk === 'Critique') variant = 'destructive';
        
        return <Badge variant={variant}>{risk}</Badge>;
      },
    },
  ], []);

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-foreground">Matrice du Cadre Logique</h2>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Exporter
          </Button>
          <Button variant="default" className="gap-2">
            <Plus className="h-4 w-4" />
            Ajouter un Indicateur
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-background rounded-lg border border-border shadow-sm flex flex-col">
        <div className="p-5">
          <DataTable 
            columns={columns} 
            data={MOCK_LOGFRAME} 
          />
        </div>
      </div>
    </div>
  );
}
