import { useParams } from 'react-router-dom';
import { useUIStore } from '@/stores/uiStore';
import { useJournal } from '@/hooks/useJournal';
import { useProject } from '@/hooks/useProjects';
import { PageHeader } from '@/components/layout/AppShell';
import { ContentLayout } from '@/components/layout/ContentLayout';
import { KPICard } from '@/components/shared/KPICard';
import { formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Loader2, ListTodo, Wallet, Coins, Landmark, ShieldCheck } from 'lucide-react';
import { useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/ui/data-table/DataTable';
import { Badge } from '@/components/ui/data-display/Badge';

export default function JournalPage() {
  const { id: urlProjectId } = useParams();
  const { activeProjectId } = useUIStore();
  const resolvedProjectId = urlProjectId || activeProjectId || '';

  const { data: project } = useProject(resolvedProjectId);
  const { data: journalData, isLoading } = useJournal(resolvedProjectId);

  const kpis = journalData?.kpis;
  const operations = journalData?.operations || [];

  const columns = useMemo<ColumnDef<any>[]>(() => [
    {
      accessorKey: 'id_journal',
      header: 'ID',
      cell: ({ row }) => <span className="font-medium text-foreground">{row.getValue('id_journal')}</span>,
    },
    {
      accessorKey: 'date',
      header: 'DATE',
      cell: ({ row }) => <span className="whitespace-nowrap text-muted-foreground">{format(new Date(row.getValue('date')), 'dd/MM/yyyy HH:mm', { locale: fr })}</span>,
    },
    {
      accessorKey: 'entite_type',
      header: 'TYPE',
      cell: ({ row }) => <Badge variant="secondary">{row.getValue('entite_type')}</Badge>,
    },
    {
      accessorKey: 'description',
      header: 'DESCRIPTION',
      cell: ({ row }) => <span className="max-w-xs truncate block" title={row.getValue('description')}>{row.getValue('description')}</span>,
    },
    {
      id: 'montant',
      header: 'MONTANT',
      meta: { align: 'right' },
      cell: ({ row }) => {
        const op = row.original;
        const amount = op.decaisse > 0 ? op.decaisse : op.engage;
        return <span className="font-mono text-foreground font-bold">{formatCurrency(amount, project?.devise)}</span>;
      },
    },
    {
      id: 'integrite',
      header: 'INTÉGRITÉ',
      meta: { align: 'center' },
      cell: ({ row }) => (
        <div className="flex items-center justify-center text-success" title={`Hash: ${row.original.hash}`}>
          <ShieldCheck size={18} />
        </div>
      ),
    },
  ], [project?.devise]);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center bg-background">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <ContentLayout>
      <PageHeader
        title={`Journal des opérations — ${project?.nom_projet ?? '...'}`}
        subtitle={`${project?.code_projet || ''} · Moteur chronologique : chaque ligne représente une tâche, un engagement ou une dépense.`}
        className="mb-6"
      />

      <div className="flex flex-col gap-6">
        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            label="Opérations"
            value={kpis?.operationsCount || 0}
            icon={ListTodo}
            color="blue"
          />
          <KPICard
            label="Prévu Total"
            value={formatCurrency(kpis?.prevuTotal || 0, project?.devise)}
            icon={Wallet}
            color="blue"
          />
          <KPICard
            label="Engagé Total"
            value={formatCurrency(kpis?.engageTotal || 0, project?.devise)}
            icon={Landmark}
            color="yellow"
          />
          <KPICard
            label="Décaissé Total"
            value={formatCurrency(kpis?.decaisseTotal || 0, project?.devise)}
            icon={Coins}
            color="green"
          />
        </div>

        {/* Tableau du Journal */}
        <div className="bg-background rounded-lg shadow-sm border border-border flex flex-col">
          <div className="p-5">
            <DataTable 
              columns={columns} 
              data={operations} 
            />
          </div>
        </div>

        {/* Automatisation Métier Proposée */}
        <div className="bg-success/10 border border-success/20 rounded-lg p-5 flex flex-col gap-2">
          <h3 className="font-semibold text-foreground flex items-center gap-2">
            <ShieldCheck className="text-success" size={20} />
            Registre d'audit cryptographique (Ledger)
          </h3>
          <p className="text-sm text-muted-foreground">
            Ce journal est <strong>immuable</strong>. Chaque ligne est scellée avec un Hash SHA-256 (visible au survol du bouclier). Les modifications et suppressions sont impossibles (Append-Only).
          </p>
        </div>
      </div>
    </ContentLayout>
  );
}
