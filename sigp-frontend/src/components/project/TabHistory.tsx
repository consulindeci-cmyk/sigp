import { useCallback, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useHistory } from '@/hooks/useHistory';
import { useUIStore } from '@/stores/uiStore';
import * as XLSX from 'xlsx';
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import type { ColumnDef } from '@tanstack/react-table';
import {
  History, Calendar, CalendarDays, Download, FileSpreadsheet,
  ShieldAlert, AlertCircle, Eye,
} from 'lucide-react';
import type { HistoriqueProjet, TypeActionHistorique, NiveauHistorique, ModuleHistorique } from '@/types';
import {
  ACTION_LABEL, ACTION_OPTIONS, NIVEAU_OPTIONS, MODULES_HISTORIQUE,
} from '@/mocks/historyMocks';
import { useHistoryStats } from '@/hooks/useHistory';
import { HistorySlideOver } from './history/HistorySlideOver';
import { DataTable }  from '@/components/ui/data-table/DataTable';
import { StatCard }   from '@/components/ui/data-display/StatCard';
import { Badge }      from '@/components/ui/data-display/Badge';
import { Button }     from '@/components/ui/forms/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/data-display/Card';

// ─── Constants ────────────────────────────────────────────────────────────────

const NIVEAU_LABEL: Record<NiveauHistorique, string> = {
  INFO:          'Info',
  AVERTISSEMENT: 'Avertissement',
  CRITIQUE:      'Critique',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function niveauVariant(n: NiveauHistorique): 'info' | 'warning' | 'destructive' {
  if (n === 'INFO')          return 'info';
  if (n === 'AVERTISSEMENT') return 'warning';
  return 'destructive';
}

function actionVariant(a: TypeActionHistorique): 'default' | 'success' | 'destructive' | 'warning' | 'secondary' | 'info' | 'outline' {
  switch (a) {
    case 'CREATION':       return 'success';
    case 'MODIFICATION':   return 'default';
    case 'SUPPRESSION':    return 'destructive';
    case 'VALIDATION':     return 'success';
    case 'REJET':          return 'destructive';
    case 'CONNEXION':      return 'info';
    case 'DECONNEXION':    return 'secondary';
    case 'TELECHARGEMENT': return 'info';
    case 'IMPORT':         return 'warning';
    case 'EXPORT':         return 'warning';
    case 'ARCHIVAGE':      return 'secondary';
    case 'RESTAURATION':   return 'outline';
    default:               return 'secondary';
  }
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function TabHistory() {
  const { id: urlProjectId } = useParams<{ id: string }>();
  const activeProjectId      = useUIStore(s => s.activeProjectId);
  const projectId            = urlProjectId || activeProjectId || '';

  const { data: apiData } = useHistory(projectId);
  // Dérivé de la réponse serveur, jamais copié dans un state local (cf. audit
  // — même pattern déjà corrigé sur Documents/Rapports/Livrables).
  const evenements = useMemo(() => apiData?.data ?? [], [apiData]);

  const [slideOpen,  setSlideOpen]  = useState(false);
  const [slideEvt,   setSlideEvt]   = useState<HistoriqueProjet | null>(null);

  const stats = useHistoryStats(evenements);

  // ── Alertes CRITIQUE ─────────────────────────────────────────────────────

  const critiqueEvts = useMemo(
    () => evenements.filter(e => e.niveau === 'CRITIQUE'),
    [evenements],
  );

  // ── Chart data ────────────────────────────────────────────────────────────

  const activiteData = useMemo(() => {
    const months: { label: string; Événements: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const dt = new Date();
      dt.setDate(1);
      dt.setMonth(dt.getMonth() - i);
      const mois  = dt.toISOString().slice(0, 7);
      const label = dt.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' });
      months.push({ label, Événements: evenements.filter(e => e.date.startsWith(mois)).length });
    }
    return months;
  }, [evenements]);

  const moduleData = useMemo(() =>
    MODULES_HISTORIQUE
      .map(m => ({ name: m, Événements: evenements.filter(e => e.module === m).length }))
      .filter(d => d.Événements > 0)
      .sort((a, b) => b.Événements - a.Événements)
      .slice(0, 10),
  [evenements]);

  const actionData = useMemo(() =>
    ACTION_OPTIONS
      .map(o => ({ name: o.label, Événements: evenements.filter(e => e.action === o.value).length }))
      .filter(d => d.Événements > 0)
      .sort((a, b) => b.Événements - a.Événements),
  [evenements]);

  // ── Filters ───────────────────────────────────────────────────────────────

  const utilisateurOptions = useMemo(() => {
    const unique = [...new Set(evenements.map(e => e.utilisateur))].sort();
    return unique.map(u => ({ label: u, value: u }));
  }, [evenements]);

  const tableFilters = useMemo(() => [
    {
      id: 'module',
      title: 'Module',
      options: MODULES_HISTORIQUE.map(m => ({ label: m, value: m })),
    },
    {
      id: 'utilisateur',
      title: 'Utilisateur',
      options: utilisateurOptions,
    },
    {
      id: 'action',
      title: 'Action',
      options: ACTION_OPTIONS.map(o => ({ label: o.label, value: o.value })),
    },
    {
      id: 'niveau',
      title: 'Niveau',
      options: NIVEAU_OPTIONS.map(o => ({ label: o.label, value: o.value })),
    },
  ], [utilisateurOptions]);

  // ── Handlers ─────────────────────────────────────────────────────────────

  const openView = useCallback((e: HistoriqueProjet) => {
    setSlideEvt(e);
    setSlideOpen(true);
  }, []);

  // ── Exports ───────────────────────────────────────────────────────────────

  // IP/Navigateur volontairement absents des exports : aucune Edge Function
  // ne renseigne jamais ip_address/user_agent sur `historique` (cf. audit),
  // ces colonnes seraient donc toujours vides — même raison que leur absence
  // de HistorySlideOver.tsx.
  const exportCSV = useCallback(() => {
    const bom     = '﻿';
    const headers = ['ID', 'Date', 'Heure', 'Utilisateur', 'Rôle',
      'Module', 'Élément', 'Action', 'Description', 'Niveau'];
    const rows = evenements.map(e => [
      e.id, e.date, e.heure, e.utilisateur, e.role,
      e.module, e.element, ACTION_LABEL[e.action], e.description,
      NIVEAU_LABEL[e.niveau],
    ]);
    const csv  = bom + [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(';')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = 'historique.csv'; a.click();
    URL.revokeObjectURL(url);
  }, [evenements]);

  const exportXLSX = useCallback(() => {
    const headers = ['ID', 'Date', 'Heure', 'Utilisateur', 'Rôle',
      'Module', 'Élément', 'Action', 'Description', 'Niveau'];
    const rows = evenements.map(e => [
      e.id, e.date, e.heure, e.utilisateur, e.role,
      e.module, e.element, ACTION_LABEL[e.action], e.description,
      NIVEAU_LABEL[e.niveau],
    ]);
    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Historique');
    XLSX.writeFile(wb, 'historique.xlsx');
  }, [evenements]);

  // ── Column definitions ────────────────────────────────────────────────────

  const columns = useMemo<ColumnDef<HistoriqueProjet, unknown>[]>(() => [
    {
      accessorKey: 'date',
      header: 'Date',
      meta: { isSticky: true } as Record<string, unknown>,
      cell: ({ row }) => (
        <div className="flex flex-col gap-0.5 min-w-[80px]">
          <span className="font-mono text-[11px] text-foreground whitespace-nowrap">
            {new Date(row.original.date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
          </span>
          <span className="font-mono text-[10px] text-muted-foreground whitespace-nowrap">
            {row.original.heure.slice(0, 5)}
          </span>
        </div>
      ),
    },
    {
      accessorKey: 'utilisateur',
      header: 'Utilisateur',
      cell: ({ row }) => {
        const name     = row.original.utilisateur;
        const initials = name.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase();
        return (
          <div className="flex items-center gap-2 min-w-[140px]">
            <div className="h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold shrink-0">
              {initials}
            </div>
            <div className="flex flex-col gap-0">
              <span className="text-[12px] font-medium text-foreground truncate max-w-[110px]">{name}</span>
              <span className="text-[10px] text-muted-foreground truncate max-w-[110px]">{row.original.role}</span>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'module',
      header: 'Module',
      cell: ({ getValue }) => (
        <Badge variant="outline" className="text-[10px] whitespace-nowrap">
          {getValue() as ModuleHistorique}
        </Badge>
      ),
    },
    {
      accessorKey: 'action',
      header: 'Action',
      cell: ({ getValue }) => {
        const a = getValue() as TypeActionHistorique;
        return (
          <Badge variant={actionVariant(a)} className="text-[10px] whitespace-nowrap">
            {ACTION_LABEL[a]}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'element',
      header: 'Élément concerné',
      cell: ({ getValue }) => (
        <span className="text-[12px] text-foreground max-w-[180px] truncate block" title={getValue() as string}>
          {getValue() as string}
        </span>
      ),
    },
    {
      accessorKey: 'description',
      header: 'Description',
      cell: ({ getValue }) => (
        <span className="text-[11px] text-muted-foreground max-w-[260px] truncate block line-clamp-2" title={getValue() as string}>
          {getValue() as string}
        </span>
      ),
    },
    {
      accessorKey: 'niveau',
      header: 'Niveau',
      cell: ({ getValue }) => {
        const n = getValue() as NiveauHistorique;
        return (
          <Badge variant={niveauVariant(n)} className="text-[10px] whitespace-nowrap">
            {NIVEAU_LABEL[n]}
          </Badge>
        );
      },
    },
    {
      id: 'actions',
      enableHiding: false,
      meta: { align: 'right', isStickyRight: true } as Record<string, unknown>,
      cell: ({ row }) => (
        <div className="flex items-center gap-1 justify-end">
          <Button variant="ghost" size="sm" aria-label="Voir le détail" onClick={() => openView(row.original)}>
            <Eye className="h-3.5 w-3.5" />
          </Button>
        </div>
      ),
    },
  ], [openView]);

  // ── JSX ──────────────────────────────────────────────────────────────────

  return (
    <section aria-label="Historique des opérations" className="flex flex-col gap-6">

      {/* ── En-tête ──────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-border">
        <div>
          <h1 className="text-base font-bold text-foreground">Journal d'Audit</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Traçabilité complète de toutes les opérations effectuées sur le projet
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <div className="flex items-center gap-2">
            <Button
              variant="outline" size="sm" className="h-8 text-xs" onClick={exportCSV}
              title="L'export est actuellement limité aux 200 derniers événements affichés."
            >
              <Download className="h-3.5 w-3.5 mr-1.5" aria-hidden="true" />
              CSV
            </Button>
            <Button
              variant="outline" size="sm" className="h-8 text-xs" onClick={exportXLSX}
              title="L'export est actuellement limité aux 200 derniers événements affichés."
            >
              <FileSpreadsheet className="h-3.5 w-3.5 mr-1.5" aria-hidden="true" />
              Excel
            </Button>
          </div>
          <p className="text-[10px] text-muted-foreground">
            Limité aux 200 derniers événements affichés
          </p>
        </div>
      </div>

      {/* ── Alerte CRITIQUE ──────────────────────────────────────────────── */}
      {critiqueEvts.length > 0 && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 flex items-start gap-3">
          <AlertCircle className="h-4 w-4 text-destructive mt-0.5 shrink-0" aria-hidden="true" />
          <div>
            <p className="text-sm font-semibold text-destructive">
              {critiqueEvts.length} événement{critiqueEvts.length > 1 ? 's' : ''} de niveau CRITIQUE détecté{critiqueEvts.length > 1 ? 's' : ''}
            </p>
            <p className="text-xs text-destructive/80 mt-1 space-y-0.5">
              {critiqueEvts.map(e => (
                <span key={e.id} className="block">
                  <span className="font-mono">[{e.date} {e.heure.slice(0, 5)}]</span>{' '}
                  <strong>{e.module}</strong> — {e.element} —{' '}
                  <span className="font-medium">{ACTION_LABEL[e.action]}</span>
                </span>
              ))}
            </p>
          </div>
        </div>
      )}

      {/* ── KPIs ─────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title="Total événements"
          value={stats.total}
          icon={<History className="h-4 w-4 text-primary" aria-hidden="true" />}
          iconVariant="primary"
          description="Dans le journal"
        />
        <StatCard
          title="Aujourd'hui"
          value={stats.aujourd_hui}
          icon={<Calendar className="h-4 w-4 text-success" aria-hidden="true" />}
          iconVariant="success"
          description="Ce jour"
        />
        <StatCard
          title="Cette semaine"
          value={stats.cette_semaine}
          icon={<CalendarDays className="h-4 w-4 text-info" aria-hidden="true" />}
          iconVariant="info"
          description="7 derniers jours"
        />
        <StatCard
          title="Exports / DL"
          value={stats.exports}
          icon={<Download className="h-4 w-4 text-warning" aria-hidden="true" />}
          iconVariant="warning"
          description="Exports & téléchargements"
        />
        <StatCard
          title="Alertes"
          value={stats.alertes}
          icon={<ShieldAlert className="h-4 w-4 text-destructive" aria-hidden="true" />}
          iconVariant="destructive"
          description="Critique + Avertissement"
        />
      </div>

      {/* ── Graphiques ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Activité quotidienne (mensuelle) */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Activité mensuelle</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={activiteData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="label" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: 6, fontSize: 11 }}
                  formatter={(v) => [`${v}`, 'Événements']}
                />
                <Legend wrapperStyle={{ fontSize: 11, color: 'hsl(var(--muted-foreground))' }} />
                <Line type="monotone" dataKey="Événements" stroke="hsl(var(--primary))" strokeWidth={2}
                  dot={{ fill: 'hsl(var(--primary))', r: 3 }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Événements par module */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Par module</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={moduleData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 8 }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: 6, fontSize: 11 }}
                  formatter={(v) => [`${v}`, 'Événements']}
                  cursor={{ fill: 'hsl(var(--muted))', opacity: 0.5 }}
                />
                <Bar dataKey="Événements" fill="hsl(var(--primary))" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Événements par type d'action */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Par type d'action</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={actionData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 8 }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: 6, fontSize: 11 }}
                  formatter={(v) => [`${v}`, 'Événements']}
                  cursor={{ fill: 'hsl(var(--muted))', opacity: 0.5 }}
                />
                <Bar dataKey="Événements" fill="hsl(var(--secondary-foreground))" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* ── DataTable ─────────────────────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-base">Journal des événements</CardTitle>
          <span className="text-xs text-muted-foreground font-mono">{evenements.length} entrées</span>
        </CardHeader>
        <CardContent className="p-0">
          <DataTable
            columns={columns}
            data={evenements}
            searchKey="utilisateur"
            searchPlaceholder="Rechercher par utilisateur, élément, description…"
            filters={tableFilters}
          />
        </CardContent>
      </Card>

      {/* ── SlideOver détail ─────────────────────────────────────────────── */}
      <HistorySlideOver
        open={slideOpen}
        onOpenChange={setSlideOpen}
        evenement={slideEvt}
      />

    </section>
  );
}
