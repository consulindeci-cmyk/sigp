import { useState } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { Eye, X, GitCommit } from 'lucide-react';
import { DataTable } from '@/components/ui/data-table/DataTable';
import { Badge } from '@/components/ui/data-display/Badge';
import { Button } from '@/components/ui/forms/Button';
import { StatCard } from '@/components/ui/data-display/StatCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/data-display/Card';
import {
  SlideOver, SlideOverContent, SlideOverHeader, SlideOverTitle,
  SlideOverBody, SlideOverFooter, SlideOverClose,
} from '@/components/ui/overlays/SlideOver';
import {
  mockHistoryEntries,
  type HistoryEntry,
  type HistoryModule,
} from '@/mocks/historyMocks';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch { return dateStr; }
}

function moduleVariant(m: HistoryModule): 'default' | 'secondary' | 'outline' {
  if (m === 'Budget' || m === 'Décaissements') return 'default';
  if (m === 'Informations générales') return 'secondary';
  return 'outline';
}

// ─────────────────────────────────────────────────────────────────────────────
// SlideOver — Voir uniquement
// ─────────────────────────────────────────────────────────────────────────────

function HistorySlideOver({
  open, onOpenChange, entry,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entry: HistoryEntry | null;
}) {
  return (
    <SlideOver open={open} onOpenChange={onOpenChange}>
      <SlideOverContent>
        <SlideOverHeader>
          <SlideOverTitle>Détails de la modification</SlideOverTitle>
          <SlideOverClose asChild>
            <Button variant="ghost" size="sm" aria-label="Fermer"><X className="h-4 w-4" /></Button>
          </SlideOverClose>
        </SlideOverHeader>

        <SlideOverBody>
          {entry ? (
            <div className="flex flex-col gap-5">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline" className="font-mono text-[11px]">{entry.version}</Badge>
                <Badge variant={moduleVariant(entry.module)} className="text-[11px]">{entry.module}</Badge>
              </div>

              <div className="flex flex-col gap-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Description</p>
                <p className="text-[13px] text-foreground leading-relaxed">{entry.modification}</p>
              </div>

              <div className="flex flex-col gap-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Champ modifié</p>
                <p className="text-[13px] font-medium text-foreground">{entry.champ}</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-destructive mb-1.5">Ancienne valeur</p>
                  <p className="font-mono text-[12px] text-foreground">{entry.ancienneValeur}</p>
                </div>
                <div className="bg-success/5 border border-success/20 rounded-lg p-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-success mb-1.5">Nouvelle valeur</p>
                  <p className="font-mono text-[12px] text-foreground">{entry.nouvelleValeur}</p>
                </div>
              </div>

              <div className="border-t border-border pt-4 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Auteur</p>
                  <div className="flex items-center gap-1.5">
                    <div className="h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold shrink-0">
                      {entry.initialesAuteur}
                    </div>
                    <span className="text-[13px] text-foreground">{entry.auteur}</span>
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Date</p>
                  <p className="font-mono text-[13px] text-foreground">{formatDate(entry.date)}</p>
                </div>
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
// Columns
// ─────────────────────────────────────────────────────────────────────────────

function buildHistoryColumns(onView: (e: HistoryEntry) => void): ColumnDef<HistoryEntry, any>[] {
  return [
    {
      id: 'version',
      accessorKey: 'version',
      header: 'Version',
      meta: { isSticky: true } as any,
      cell: ({ row }) => (
        <div className="flex flex-col gap-0.5 min-w-[90px]">
          <Badge variant="outline" className="font-mono text-[11px] w-max">{row.original.version}</Badge>
          <span className="font-mono text-[11px] text-muted-foreground">{row.original.date}</span>
        </div>
      ),
    },
    {
      accessorKey: 'auteur',
      header: 'Auteur',
      cell: ({ row }) => {
        const { initialesAuteur, auteur } = row.original;
        return (
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold shrink-0">
              {initialesAuteur}
            </div>
            <span className="text-[12px] text-foreground truncate">{auteur}</span>
          </div>
        );
      },
    },
    {
      accessorKey: 'module',
      header: 'Module',
      cell: ({ getValue }) => {
        const m = getValue() as HistoryModule;
        return <Badge variant={moduleVariant(m)} className="text-[11px] w-max">{m}</Badge>;
      },
    },
    {
      accessorKey: 'champ',
      header: 'Champ',
      cell: ({ getValue }) => (
        <span className="text-[12px] font-medium text-foreground">{getValue() as string}</span>
      ),
    },
    {
      accessorKey: 'ancienneValeur',
      header: 'Ancienne valeur',
      cell: ({ getValue }) => (
        <span className="font-mono text-[11px] text-destructive line-clamp-2 max-w-[140px]">{getValue() as string}</span>
      ),
    },
    {
      accessorKey: 'nouvelleValeur',
      header: 'Nouvelle valeur',
      cell: ({ getValue }) => (
        <span className="font-mono text-[11px] text-success line-clamp-2 max-w-[140px]">{getValue() as string}</span>
      ),
    },
    {
      id: 'actions',
      enableHiding: false,
      meta: { align: 'right' } as any,
      cell: ({ row }) => (
        <Button variant="ghost" size="sm" aria-label="Voir les détails" onClick={() => onView(row.original)}>
          <Eye className="h-3.5 w-3.5" />
        </Button>
      ),
    },
  ];
}

// ─────────────────────────────────────────────────────────────────────────────
// Main export
// ─────────────────────────────────────────────────────────────────────────────

export default function ProjectHistoryTab() {
  const [slideOverOpen, setSlideOverOpen] = useState(false);
  const [selected, setSelected] = useState<HistoryEntry | null>(null);

  const columns = buildHistoryColumns((e) => { setSelected(e); setSlideOverOpen(true); });

  return (
    <section aria-label="Historique des modifications" className="flex flex-col gap-6">

      {/* ── HEADER ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-border">
        <div>
          <h1 className="text-base font-bold text-foreground">Historique des Modifications</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Journal d'audit — traçabilité de toutes les modifications du projet</p>
        </div>
      </div>

      {/* KPI unique */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Versions enregistrées"
          value={mockHistoryEntries.length}
          icon={<GitCommit className="h-4 w-4" aria-hidden="true" />}
          iconVariant="primary"
          description={`Dernière : ${mockHistoryEntries[0]?.version ?? '—'}`}
        />
        <StatCard
          title="Dernière modification"
          value={mockHistoryEntries[0]?.date ?? '—'}
          icon={<Eye className="h-4 w-4" aria-hidden="true" />}
          iconVariant="default"
          description={mockHistoryEntries[0]?.auteur ?? '—'}
        />
        <StatCard
          title="Modules modifiés"
          value={new Set(mockHistoryEntries.map((e) => e.module)).size}
          icon={<GitCommit className="h-4 w-4" aria-hidden="true" />}
          iconVariant="default"
          description="Modules distincts impactés"
        />
      </div>

      {/* DataTable */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Journal d'audit</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <DataTable
            columns={columns}
            data={mockHistoryEntries}
            searchKey="modification"
            searchPlaceholder="Rechercher une modification..."
            filters={[
              {
                id: 'module',
                title: 'Module',
                options: [
                  { label: 'Informations générales', value: 'Informations générales' },
                  { label: 'Budget', value: 'Budget' },
                  { label: 'Activités', value: 'Activités' },
                  { label: 'Gouvernance', value: 'Gouvernance' },
                  { label: 'Livrables', value: 'Livrables' },
                  { label: 'Risques', value: 'Risques' },
                  { label: 'Décaissements', value: 'Décaissements' },
                ],
              },
            ]}
          />
        </CardContent>
      </Card>

      <HistorySlideOver
        open={slideOverOpen}
        onOpenChange={setSlideOverOpen}
        entry={selected}
      />
    </section>
  );
}
