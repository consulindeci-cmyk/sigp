import { ColumnDef } from '@tanstack/react-table';
import { Clock } from 'lucide-react';
import { DataTable } from '@/components/ui/data-table/DataTable';
import { Badge } from '@/components/ui/data-display/Badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/data-display/Card';
import { cn } from '@/lib/utils';
import {
  mockOperationLogs,
  type OperationLog,
  type LogLevel,
} from '@/mocks/operationsJournalMocks';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch { return dateStr; }
}

function niveauVariant(niveau: LogLevel): 'success' | 'default' | 'warning' | 'destructive' {
  switch (niveau) {
    case 'Succès':       return 'success';
    case 'Info':         return 'default';
    case 'Avertissement': return 'warning';
    case 'Erreur':       return 'destructive';
  }
}

function niveauDot(niveau: LogLevel): string {
  switch (niveau) {
    case 'Succès':       return 'bg-success';
    case 'Info':         return 'bg-primary';
    case 'Avertissement': return 'bg-warning';
    case 'Erreur':       return 'bg-destructive';
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Timeline compacte (5 dernières entrées)
// ─────────────────────────────────────────────────────────────────────────────

function RecentLogsTimeline({ logs }: { logs: OperationLog[] }) {
  return (
    <ul role="list" className="flex flex-col">
      {logs.map((log, idx) => {
        const isLast = idx === logs.length - 1;
        return (
          <li key={log.id} className="flex gap-3">
            <div className="flex flex-col items-center shrink-0">
              <div className={cn('h-2.5 w-2.5 rounded-full mt-1.5 shrink-0', niveauDot(log.niveau))} aria-hidden="true" />
              {!isLast && <div className="w-px flex-1 bg-border mt-1" aria-hidden="true" />}
            </div>
            <div className={cn('flex flex-col gap-0.5 pb-4 min-w-0', isLast && 'pb-0')}>
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-mono text-[11px] text-muted-foreground shrink-0">
                  {formatDate(log.date)} · {log.heure}
                </span>
                <Badge variant={niveauVariant(log.niveau)} className="text-[10px] shrink-0">{log.niveau}</Badge>
                <Badge variant="outline" className="text-[10px] shrink-0">{log.module}</Badge>
              </div>
              <p className="text-[13px] font-medium text-foreground leading-snug">{log.action}</p>
              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <div className="h-4 w-4 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[9px] font-bold shrink-0">
                  {log.initialesUtilisateur}
                </div>
                {log.utilisateur}
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Columns
// ─────────────────────────────────────────────────────────────────────────────

function buildLogColumns(): ColumnDef<OperationLog, any>[] {
  return [
    {
      id: 'datetime',
      header: 'Date / Heure',
      meta: { isSticky: true } as any,
      cell: ({ row }) => (
        <div className="flex flex-col gap-0.5 min-w-[110px]">
          <span className="font-mono text-[12px] font-semibold text-foreground">{row.original.date}</span>
          <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <Clock className="h-3 w-3 shrink-0" aria-hidden="true" />
            {row.original.heure}
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'utilisateur',
      header: 'Utilisateur',
      cell: ({ row }) => {
        const { initialesUtilisateur, utilisateur } = row.original;
        return (
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold shrink-0">
              {initialesUtilisateur}
            </div>
            <span className="text-[12px] text-foreground truncate">{utilisateur}</span>
          </div>
        );
      },
    },
    {
      accessorKey: 'niveau',
      header: 'Niveau',
      cell: ({ getValue }) => {
        const n = getValue() as LogLevel;
        return <Badge variant={niveauVariant(n)} className="text-[11px] w-max">{n}</Badge>;
      },
    },
    {
      accessorKey: 'module',
      header: 'Module',
      cell: ({ getValue }) => (
        <Badge variant="outline" className="text-[11px] w-max">{getValue() as string}</Badge>
      ),
    },
    {
      accessorKey: 'action',
      header: 'Action',
      cell: ({ getValue }) => (
        <span className="text-[12px] text-foreground line-clamp-2 max-w-[260px]">{getValue() as string}</span>
      ),
    },
    {
      accessorKey: 'resultat',
      header: 'Résultat',
      cell: ({ getValue }) => (
        <span className="text-[11px] text-muted-foreground line-clamp-2 max-w-[240px]">{getValue() as string}</span>
      ),
    },
  ];
}

// ─────────────────────────────────────────────────────────────────────────────
// Main export
// ─────────────────────────────────────────────────────────────────────────────

export default function ProjectOperationsJournalTab() {
  const columns = buildLogColumns();
  const recent = mockOperationLogs.slice(0, 5);

  return (
    <section aria-label="Journal des Opérations" className="flex flex-col gap-6">

      {/* ── HEADER ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-border">
        <div>
          <h1 className="text-base font-bold text-foreground">Journal des Opérations</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Traçabilité complète des actions et événements système</p>
        </div>
      </div>

      {/* Timeline récente */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Activité récente</CardTitle>
        </CardHeader>
        <CardContent>
          <RecentLogsTimeline logs={recent} />
        </CardContent>
      </Card>

      {/* DataTable complète */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Journal complet des opérations</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <DataTable
            columns={columns}
            data={mockOperationLogs}
            searchKey="action"
            searchPlaceholder="Rechercher une opération..."
            filters={[
              {
                id: 'niveau',
                title: 'Niveau',
                options: [
                  { label: 'Succès', value: 'Succès' },
                  { label: 'Info', value: 'Info' },
                  { label: 'Avertissement', value: 'Avertissement' },
                  { label: 'Erreur', value: 'Erreur' },
                ],
              },
              {
                id: 'module',
                title: 'Module',
                options: [
                  { label: 'Budget', value: 'Budget' },
                  { label: 'Activités', value: 'Activités' },
                  { label: 'Livrables', value: 'Livrables' },
                  { label: 'Décaissements', value: 'Décaissements' },
                  { label: 'Gouvernance', value: 'Gouvernance' },
                  { label: 'Risques', value: 'Risques' },
                  { label: 'Documents', value: 'Documents' },
                ],
              },
              {
                id: 'utilisateur',
                title: 'Utilisateur',
                options: [
                  { label: 'Amadou Diallo', value: 'Amadou Diallo' },
                  { label: 'Fatoumata Moussa', value: 'Fatoumata Moussa' },
                  { label: 'Aïchata Koné', value: 'Aïchata Koné' },
                  { label: 'Rabiou Hamidou', value: 'Rabiou Hamidou' },
                  { label: 'Boubacar Issa', value: 'Boubacar Issa' },
                  { label: 'Salif Traoré', value: 'Salif Traoré' },
                ],
              },
            ]}
          />
        </CardContent>
      </Card>
    </section>
  );
}
