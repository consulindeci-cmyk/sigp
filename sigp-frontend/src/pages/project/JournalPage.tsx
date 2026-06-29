import { PageHeader } from '@/components/layout/PageHeader';
import { useParams } from 'react-router-dom';
import { useUIStore } from '@/stores/uiStore';
import { useJournal } from '@/hooks/useJournal';
import { useProject } from '@/hooks/useProjects';
import { formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Loader2, ListTodo, Wallet, Coins, Landmark, ShieldCheck } from 'lucide-react';
import { useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/ui/data-table/DataTable';
import { Badge } from '@/components/ui/data-display/Badge';
import { StatCard } from '@/components/ui/data-display/StatCard';

export default function JournalPage() {
  const { id: urlProjectId } = useParams();
  const { activeProjectId } = useUIStore();
  const resolvedProjectId = urlProjectId || activeProjectId || '';

  const { data: project }                   = useProject(resolvedProjectId);
  const { data: journalData, isLoading }    = useJournal(resolvedProjectId);

  const kpis       = journalData?.kpis;
  const operations = journalData?.operations || [];

  const columns = useMemo<ColumnDef<any>[]>(() => [
    {
      accessorKey: 'id_journal',
      header: 'ID',
      cell: ({ row }) => (
        <span className="font-medium text-foreground">{row.getValue('id_journal')}</span>
      ),
    },
    {
      accessorKey: 'date',
      header: 'DATE',
      cell: ({ row }) => (
        <span className="whitespace-nowrap text-muted-foreground">
          {format(new Date(row.getValue('date')), 'dd/MM/yyyy HH:mm', { locale: fr })}
        </span>
      ),
    },
    {
      accessorKey: 'entite_type',
      header: 'TYPE',
      cell: ({ row }) => (
        <Badge variant="secondary">{row.getValue('entite_type')}</Badge>
      ),
    },
    {
      accessorKey: 'description',
      header: 'DESCRIPTION',
      cell: ({ row }) => (
        <span className="max-w-xs truncate block" title={row.getValue('description')}>
          {row.getValue('description')}
        </span>
      ),
    },
    {
      id: 'montant',
      header: 'MONTANT',
      meta: { align: 'right' },
      cell: ({ row }) => {
        const op = row.original;
        const amount = op.decaisse > 0 ? op.decaisse : op.engage;
        return (
          <span className="font-mono text-foreground font-bold">
            {formatCurrency(amount, project?.devise)}
          </span>
        );
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
    <div className="flex flex-col h-full overflow-hidden bg-background">

      {/* ── HEADER ─────────────────────────────────────────────────────────── */}
      <div className="shrink-0 flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b border-border bg-card">
        <div>
          <PageHeader 
            title={`Journal des opérations - ${project?.nom_projet ?? '...'}`} 
            description={`${project?.code_projet ? project.code_projet + ' - ' : ''}Moteur chronologique : chaque ligne représente une tâche, un engagement ou une dépense.`} 
          />
        </div>
      </div>

      {/* ── KPI STRIP ──────────────────────────────────────────────────────── */}
      <div className="shrink-0 grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 px-4 py-3 border-b border-border bg-muted/10">
        <StatCard
          title="Opérations"
          value={kpis?.operationsCount ?? 0}
          icon={<ListTodo className="h-4 w-4" />}
          iconVariant="info"
          description="Transactions enregistrées"
        />
        <StatCard
          title="Prévu Total"
          value={formatCurrency(kpis?.prevuTotal ?? 0, project?.devise)}
          icon={<Wallet className="h-4 w-4" />}
          iconVariant="primary"
          description="Budget planifié"
        />
        <StatCard
          title="Engagé Total"
          value={formatCurrency(kpis?.engageTotal ?? 0, project?.devise)}
          icon={<Landmark className="h-4 w-4" />}
          iconVariant="warning"
          description="Montant engagé"
        />
        <StatCard
          title="Décaissé Total"
          value={formatCurrency(kpis?.decaisseTotal ?? 0, project?.devise)}
          icon={<Coins className="h-4 w-4" />}
          iconVariant="success"
          description="Montant décaissé"
        />
      </div>

      {/* ── CONTENU ────────────────────────────────────────────────────────── */}
      <div className="flex-1 min-h-0 overflow-auto">
        <div className="p-4 flex flex-col gap-4">

          {/* Tableau du journal */}
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <div className="px-4 py-2.5 border-b border-border bg-muted/5">
              <h2 className="text-sm font-semibold text-foreground">Registre des opérations</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                {operations.length} opération{operations.length !== 1 ? 's' : ''} enregistrée{operations.length !== 1 ? 's' : ''}
              </p>
            </div>
            <DataTable columns={columns} data={operations} />
          </div>

          {/* Audit cryptographique */}
          <div className="flex items-start gap-3 bg-success/10 border border-success/20 rounded-lg p-5">
            <ShieldCheck className="h-5 w-5 text-success shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <h4 className="text-sm font-semibold text-foreground">
                Registre d'audit cryptographique (Ledger)
              </h4>
              <p className="text-sm text-muted-foreground mt-0.5">
                Ce journal est <strong>immuable</strong>. Chaque ligne est scellée avec un Hash SHA-256
                (visible au survol du bouclier). Les modifications et suppressions sont impossibles
                (Append-Only).
              </p>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}
