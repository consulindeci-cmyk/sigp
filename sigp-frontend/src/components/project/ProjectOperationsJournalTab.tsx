import { useState, useMemo, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { ColumnDef } from '@tanstack/react-table';
import {
  Clock, Eye, X, Download, CheckCircle2, AlertTriangle,
  Info, AlertCircle, Activity, Network,
} from 'lucide-react';
import { DataTable } from '@/components/ui/data-table/DataTable';
import { Badge } from '@/components/ui/data-display/Badge';
import { Button } from '@/components/ui/forms/Button';
import { StatCard } from '@/components/ui/data-display/StatCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/data-display/Card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/navigation/Tabs';
import {
  SlideOver, SlideOverContent, SlideOverHeader, SlideOverTitle,
  SlideOverBody, SlideOverFooter, SlideOverClose,
} from '@/components/ui/overlays/SlideOver';
import { cn } from '@/lib/utils';
import { type OperationLog, type LogLevel } from '@/mocks/operationsJournalMocks';
import { useJournal, type JournalOperation } from '@/hooks/useJournal';
import { useUIStore } from '@/stores/uiStore';
import WBSPage from '@/pages/project/WBSPage';

function adaptJournalOp(op: JournalOperation): OperationLog {
  const statutToNiveau: Record<string, LogLevel> = {
    TERMINE: 'Succès',
    ANNULE:  'Erreur',
    EN_COURS: 'Info',
    A_FAIRE:  'Info',
  };
  const dateStr = op.date ? op.date.slice(0, 10) : '—';
  const heureStr = op.date && op.date.length > 10 ? op.date.slice(11, 16) : '—';
  const resultat = [
    `Prévu: ${op.prevu.toLocaleString('fr-FR')}`,
    `Engagé: ${op.engage.toLocaleString('fr-FR')}`,
    `Décaissé: ${op.decaisse.toLocaleString('fr-FR')}`,
  ].join(' / ');
  return {
    id:                    op.id,
    date:                  dateStr,
    heure:                 heureStr,
    utilisateur:           op.wbs || '—',
    initialesUtilisateur:  op.wbs ? op.wbs.slice(0, 2).toUpperCase() : '—',
    action:                op.description,
    module:                'Budget',
    resultat,
    niveau:                statutToNiveau[op.statut] ?? 'Info',
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function niveauVariant(niveau: LogLevel): 'success' | 'default' | 'warning' | 'destructive' {
  switch (niveau) {
    case 'Succès':        return 'success';
    case 'Info':          return 'default';
    case 'Avertissement': return 'warning';
    case 'Erreur':        return 'destructive';
  }
}

function niveauDot(niveau: LogLevel): string {
  switch (niveau) {
    case 'Succès':        return 'bg-success';
    case 'Info':          return 'bg-primary';
    case 'Avertissement': return 'bg-warning';
    case 'Erreur':        return 'bg-destructive';
  }
}

function exportCsv(logs: OperationLog[]) {
  const HEADERS = ['Date', 'Heure', 'Utilisateur', 'Module', 'Niveau', 'Action', 'Résultat'];
  const rows = logs.map(l => [
    l.date, l.heure, l.utilisateur, l.module, l.niveau, l.action, l.resultat,
  ]);
  const csv = '﻿' + [HEADERS, ...rows]
    .map(row => row.map(c => `"${String(c).replace(/"/g, '""')}"`).join(';'))
    .join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `journal-operations-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
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
                  {log.date} · {log.heure}
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
// SlideOver — détail d'une entrée (lecture seule, journal immuable)
// ─────────────────────────────────────────────────────────────────────────────

function LogDetailSlideOver({
  open, onOpenChange, log,
}: {
  open:         boolean;
  onOpenChange: (open: boolean) => void;
  log:          OperationLog | null;
}) {
  return (
    <SlideOver open={open} onOpenChange={onOpenChange}>
      <SlideOverContent>
        <SlideOverHeader>
          <SlideOverTitle>Détails de l'opération</SlideOverTitle>
          <SlideOverClose asChild>
            <Button variant="ghost" size="sm" aria-label="Fermer"><X className="h-4 w-4" /></Button>
          </SlideOverClose>
        </SlideOverHeader>

        <SlideOverBody>
          {log ? (
            <div className="flex flex-col gap-5">

              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant={niveauVariant(log.niveau)} className="text-[11px]">{log.niveau}</Badge>
                <Badge variant="outline" className="text-[11px]">{log.module}</Badge>
              </div>

              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Action</p>
                <p className="text-[14px] font-semibold text-foreground leading-snug">{log.action}</p>
              </div>

              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Résultat</p>
                <p className="text-[13px] text-foreground leading-relaxed">{log.resultat}</p>
              </div>

              <div className="border-t border-border pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Utilisateur</p>
                  <div className="flex items-center gap-1.5">
                    <div className="h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold shrink-0">
                      {log.initialesUtilisateur}
                    </div>
                    <span className="text-[13px] text-foreground">{log.utilisateur}</span>
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Date & Heure</p>
                  <p className="font-mono text-[13px] text-foreground">{log.date} à {log.heure}</p>
                </div>
              </div>

              <div className="bg-muted/30 rounded-lg p-3 border border-border">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Référence</p>
                <p className="font-mono text-[11px] text-muted-foreground">ID: {log.id}</p>
              </div>

            </div>
          ) : null}
        </SlideOverBody>

        <SlideOverFooter>
          <SlideOverClose asChild>
            <Button variant="outline">Fermer</Button>
          </SlideOverClose>
        </SlideOverFooter>
      </SlideOverContent>
    </SlideOver>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Colonnes du DataTable
// ─────────────────────────────────────────────────────────────────────────────

function buildLogColumns(onView: (log: OperationLog) => void): ColumnDef<OperationLog, unknown>[] {
  return [
    {
      id: 'datetime',
      header: 'Date / Heure',
      meta: { isSticky: true } as Record<string, unknown>,
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
    {
      id: 'actions',
      enableHiding: false,
      meta: { align: 'right' } as Record<string, unknown>,
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="sm"
          aria-label="Voir les détails"
          onClick={() => onView(row.original)}
        >
          <Eye className="h-3.5 w-3.5" />
        </Button>
      ),
    },
  ];
}

// ─────────────────────────────────────────────────────────────────────────────
// Composant principal
// ─────────────────────────────────────────────────────────────────────────────

export default function ProjectOperationsJournalTab() {
  const { id: urlProjectId } = useParams<{ id: string }>();
  const activeProjectId = useUIStore(s => s.activeProjectId);
  const projectId = urlProjectId || activeProjectId || '';

  const { data: apiData, isLoading } = useJournal(projectId);

  const [logs, setLogs] = useState<OperationLog[]>([]);

  useEffect(() => {
    const ops = (apiData as { operations?: JournalOperation[] })?.operations
      ?? (Array.isArray((apiData as any)?.data) ? (apiData as any).data : []);
    if (apiData) setLogs(ops.map(adaptJournalOp));
  }, [apiData]);

  const [slideOverOpen, setSlideOverOpen] = useState(false);
  const [selected,      setSelected]      = useState<OperationLog | null>(null);
  const [exported,      setExported]      = useState(false);
  const [activeSubTab,  setActiveSubTab]  = useState<'journal' | 'wbs'>('journal');

  const kpis = useMemo(() => ({
    total:   logs.length,
    succes:  logs.filter(l => l.niveau === 'Succès').length,
    erreurs: logs.filter(l => l.niveau === 'Erreur' || l.niveau === 'Avertissement').length,
    modules: new Set(logs.map(l => l.module)).size,
  }), [logs]);

  const recent = useMemo(() => logs.slice(0, 5), [logs]);

  function handleExportCsv() {
    exportCsv(logs);
    setExported(true);
    setTimeout(() => setExported(false), 2500);
  }

  const columns = buildLogColumns((log) => { setSelected(log); setSlideOverOpen(true); });

  return (
    <section aria-label="Journal des Opérations & Structure (WBS)" className="flex flex-col gap-6">

      {/* ── HEADER ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-border">
        <div>
          <h1 className="text-base font-bold text-foreground">Journal des Opérations</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Traçabilité complète des actions système et structure de découpage du projet (WBS)
          </p>
        </div>
        {activeSubTab === 'journal' && (
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs"
            onClick={handleExportCsv}
          >
            <Download className="h-3.5 w-3.5 mr-1.5" aria-hidden="true" />
            Exporter CSV
          </Button>
        )}
      </div>

      <Tabs value={activeSubTab} onValueChange={(v) => setActiveSubTab(v as 'journal' | 'wbs')} className="flex flex-col gap-6">
        <TabsList className="self-start">
          <TabsTrigger value="journal" className="flex items-center gap-1.5 text-xs sm:text-sm">
            <Clock className="h-3.5 w-3.5" />
            Journal
          </TabsTrigger>
          <TabsTrigger value="wbs" className="flex items-center gap-1.5 text-xs sm:text-sm">
            <Network className="h-3.5 w-3.5" />
            Structure (WBS)
          </TabsTrigger>
        </TabsList>

        <TabsContent value="journal" className="flex flex-col gap-6 mt-0">
          {/* ── Feedback export ───────────────────────────────────────────── */}
          {exported && (
            <div className="flex items-center gap-2 text-success text-xs bg-success/10 border border-success/20 rounded-md px-3 py-2">
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              Export CSV téléchargé avec succès.
            </div>
          )}

          {/* ── KPI Strip ─────────────────────────────────────────────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Total opérations"
              value={kpis.total}
              icon={<Activity className="h-4 w-4" aria-hidden="true" />}
              iconVariant="primary"
              description="Entrées enregistrées"
            />
            <StatCard
              title="Opérations réussies"
              value={kpis.succes}
              icon={<CheckCircle2 className="h-4 w-4" aria-hidden="true" />}
              iconVariant="success"
              description="Statut Succès"
            />
            <StatCard
              title="Alertes & Erreurs"
              value={kpis.erreurs}
              icon={<AlertTriangle className="h-4 w-4" aria-hidden="true" />}
              iconVariant="warning"
              description="Avertissements + Erreurs"
            />
            <StatCard
              title="Modules tracés"
              value={kpis.modules}
              icon={<Info className="h-4 w-4" aria-hidden="true" />}
              iconVariant="default"
              description="Modules distincts"
            />
          </div>

          {/* ── Timeline récente ──────────────────────────────────────────── */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Activité récente</CardTitle>
            </CardHeader>
            <CardContent>
              <RecentLogsTimeline logs={recent} />
            </CardContent>
          </Card>

          {/* ── DataTable complète ──────────────────────────────────────────── */}
          <Card>
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-base">Journal complet des opérations</CardTitle>
              <span className="text-xs text-muted-foreground">{logs.length} entrées</span>
            </CardHeader>
            <CardContent className="p-0">
              <DataTable
                columns={columns}
                data={logs}
                isLoading={isLoading}
                searchKey="action"
                searchPlaceholder="Rechercher une opération..."
                filters={[
                  {
                    id: 'niveau',
                    title: 'Niveau',
                    options: [
                      { label: 'Succès',        value: 'Succès'        },
                      { label: 'Info',          value: 'Info'          },
                      { label: 'Avertissement', value: 'Avertissement' },
                      { label: 'Erreur',        value: 'Erreur'        },
                    ],
                  },
                  {
                    id: 'module',
                    title: 'Module',
                    options: [
                      { label: 'Budget',         value: 'Budget'        },
                      { label: 'Activités',      value: 'Activités'     },
                      { label: 'Livrables',      value: 'Livrables'     },
                      { label: 'Décaissements',  value: 'Décaissements' },
                      { label: 'Gouvernance',    value: 'Gouvernance'   },
                      { label: 'Risques',        value: 'Risques'       },
                      { label: 'Documents',      value: 'Documents'     },
                    ],
                  },
                  {
                    id: 'utilisateur',
                    title: 'Utilisateur',
                    options: [
                      { label: 'Amadou Diallo',    value: 'Amadou Diallo'    },
                      { label: 'Fatoumata Moussa', value: 'Fatoumata Moussa' },
                      { label: 'Aïchata Koné',     value: 'Aïchata Koné'     },
                      { label: 'Rabiou Hamidou',   value: 'Rabiou Hamidou'   },
                      { label: 'Boubacar Issa',    value: 'Boubacar Issa'    },
                      { label: 'Salif Traoré',     value: 'Salif Traoré'     },
                    ],
                  },
                ]}
              />
            </CardContent>
          </Card>

          {/* ── Notice registre immuable ────────────────────────────────────── */}
          <div className="flex items-start gap-3 bg-primary/5 border border-primary/20 rounded-lg p-4">
            <AlertCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <h4 className="text-sm font-semibold text-foreground">Registre en lecture seule</h4>
              <p className="text-xs text-muted-foreground mt-0.5">
                Ce journal est <strong>immuable</strong> (Append-Only). Les entrées ne peuvent pas être
                modifiées ni supprimées. Il constitue la trace d'audit officielle du projet.
              </p>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="wbs" className="mt-0">
          <WBSPage />
        </TabsContent>
      </Tabs>

      {/* ── SlideOver détail ──────────────────────────────────────────────── */}
      <LogDetailSlideOver
        open={slideOverOpen}
        onOpenChange={setSlideOverOpen}
        log={selected}
      />

    </section>
  );
}
