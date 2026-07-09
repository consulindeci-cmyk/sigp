import { useCallback, useMemo, useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  useDeliverables, useCreateDeliverable, useUpdateDeliverable, useDeleteDeliverable,
} from '@/hooks/useDeliverables';
import { useUIStore } from '@/stores/uiStore';
import * as XLSX from 'xlsx';
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import type { ColumnDef } from '@tanstack/react-table';
import {
  Package, CheckCircle2, Clock, AlertTriangle, TrendingUp,
  Download, FileSpreadsheet, Plus, Eye, Pencil, Trash2,
} from 'lucide-react';
import type { Livrable, StatutLivrable, PrioriteLivrable } from '@/types';
import {
  STATUT_LIVRABLE_OPTIONS, PRIORITE_LIVRABLE_OPTIONS, LIVRABLE_CATEGORIES,
} from '@/mocks/deliverablesMocks';
import { LivrableSlideOver } from '@/components/project/deliverables/LivrableSlideOver';
import type { LivrableSavePayload } from '@/components/project/deliverables/LivrableSlideOver';
import { DataTable } from '@/components/ui/data-table/DataTable';
import { StatCard } from '@/components/ui/data-display/StatCard';
import { Badge } from '@/components/ui/data-display/Badge';
import { ProgressBar } from '@/components/ui/data-display/ProgressBar';
import { Button } from '@/components/ui/forms/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/data-display/Card';
import {
  Modal, ModalContent, ModalHeader, ModalTitle,
  ModalDescription, ModalFooter, ModalClose,
} from '@/components/ui/overlays/Modal';

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUT_LABEL: Record<StatutLivrable, string> = {
  A_FAIRE:  'À faire',
  EN_COURS: 'En cours',
  SOUMIS:   'Soumis',
  VALIDE:   'Validé',
  REFUSE:   'Refusé',
  TERMINE:  'Terminé',
};

const PRIORITE_LABEL: Record<PrioriteLivrable, string> = {
  FAIBLE:   'Faible',
  MOYENNE:  'Moyenne',
  HAUTE:    'Haute',
  CRITIQUE: 'Critique',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(iso?: string): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('fr-FR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
    });
  } catch { return '—'; }
}

function statutVariant(s: StatutLivrable): 'outline' | 'info' | 'warning' | 'success' | 'destructive' | 'secondary' {
  if (s === 'VALIDE' || s === 'TERMINE') return 'success';
  if (s === 'EN_COURS') return 'warning';
  if (s === 'SOUMIS')   return 'info';
  if (s === 'REFUSE')   return 'destructive';
  return 'outline';
}

function prioriteVariant(p: PrioriteLivrable): 'destructive' | 'default' | 'warning' | 'secondary' {
  if (p === 'CRITIQUE') return 'destructive';
  if (p === 'HAUTE')    return 'default';
  if (p === 'MOYENNE')  return 'warning';
  return 'secondary';
}

function avancementColor(pct: number): 'success' | 'primary' | 'warning' | 'destructive' {
  if (pct === 100) return 'success';
  if (pct >= 60)   return 'primary';
  if (pct >= 20)   return 'warning';
  return 'destructive';
}

function nextCode(livrables: Livrable[]): string {
  const max = livrables.reduce((m, l) => {
    const n = parseInt(l.code_livrable.replace('LIV-', ''), 10);
    return isNaN(n) ? m : Math.max(m, n);
  }, 0);
  return `LIV-${String(max + 1).padStart(3, '0')}`;
}

function isDone(s: StatutLivrable) {
  return s === 'VALIDE' || s === 'TERMINE';
}

function isInProgress(s: StatutLivrable) {
  return s === 'EN_COURS' || s === 'SOUMIS';
}

function isLate(l: Livrable, today: string): boolean {
  return l.date_prevue < today && !['VALIDE', 'TERMINE', 'REFUSE'].includes(l.statut);
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function ProjectDeliverablesTab() {
  const { id: urlProjectId }  = useParams<{ id: string }>();
  const activeProjectId       = useUIStore(s => s.activeProjectId);
  const projectId             = urlProjectId || activeProjectId || '';

  const { data: apiData, isLoading } = useDeliverables(projectId);
  const createMutation  = useCreateDeliverable(projectId);
  const updateMutation  = useUpdateDeliverable(projectId);
  const deleteMutation  = useDeleteDeliverable(projectId);

  const [livrables, setLivrables] = useState<Livrable[]>([]);

  useEffect(() => {
    const list = (apiData as { data?: Livrable[] })?.data ?? (Array.isArray(apiData) ? apiData as Livrable[] : []);
    setLivrables(list);
  }, [apiData]);
  const [slideOpen, setSlideOpen] = useState(false);
  const [slideMode, setSlideMode] = useState<'new' | 'edit' | 'view'>('new');
  const [slideLivrable, setSlideLivrable] = useState<Livrable | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Livrable | null>(null);

  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);

  // ── KPIs ──────────────────────────────────────────────────────────────────

  const kpis = useMemo(() => {
    const termine = livrables.filter(l => isDone(l.statut)).length;
    const enCours = livrables.filter(l => isInProgress(l.statut)).length;
    const enRetard = livrables.filter(l => isLate(l, today)).length;
    const tauxAchevement = livrables.length > 0
      ? Math.round((termine / livrables.length) * 100)
      : 0;
    return { total: livrables.length, termine, enCours, enRetard, tauxAchevement };
  }, [livrables, today]);

  const livrablesenRetard = useMemo(
    () => livrables.filter(l => isLate(l, today)),
    [livrables, today],
  );

  // ── Chart data ─────────────────────────────────────────────────────────────

  const statutChartData = useMemo(() =>
    STATUT_LIVRABLE_OPTIONS.map(o => ({
      name: o.label,
      Nombre: livrables.filter(l => l.statut === o.value).length,
    })).filter(d => d.Nombre > 0),
  [livrables]);

  const categorieChartData = useMemo(() =>
    LIVRABLE_CATEGORIES
      .map(cat => ({ name: cat, Nombre: livrables.filter(l => l.categorie === cat).length }))
      .filter(d => d.Nombre > 0),
  [livrables]);

  const evolutionData = useMemo(() => {
    const months: { label: string; mois: string; Terminés: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setDate(1);
      d.setMonth(d.getMonth() - i);
      const mois = d.toISOString().slice(0, 7);
      const label = d.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' });
      const count = livrables.filter(l =>
        isDone(l.statut) && l.date_reelle?.startsWith(mois),
      ).length;
      months.push({ label, mois, Terminés: count });
    }
    return months;
  }, [livrables]);

  // ── Filters ────────────────────────────────────────────────────────────────

  const responsableOptions = useMemo(() => {
    const unique = [...new Set(livrables.map(l => l.responsable))].sort();
    return unique.map(r => ({ label: r, value: r }));
  }, [livrables]);

  const currentNextCode = useMemo(() => nextCode(livrables), [livrables]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleSave = useCallback((payload: LivrableSavePayload, id?: string) => {
    const now = new Date().toISOString();
    if (id) {
      setLivrables(prev => prev.map(l =>
        l.id === id ? { ...l, ...payload, updatedAt: now } : l,
      ));
      updateMutation.mutate({ id, ...payload });
    } else {
      const newLiv: Livrable = {
        id: `tmp-${Date.now()}`,
        projet_id: projectId,
        ...payload,
        createdAt: now,
        updatedAt: now,
      };
      setLivrables(prev => [...prev, newLiv]);
      createMutation.mutate({ projet_id: projectId, ...payload });
    }
  }, [projectId, createMutation, updateMutation]);

  const handleDeleteRequest = useCallback((livrable: Livrable) => {
    setDeleteTarget(livrable);
  }, []);

  const handleDeleteConfirm = useCallback(() => {
    if (!deleteTarget) return;
    setLivrables(prev => prev.filter(l => l.id !== deleteTarget.id));
    deleteMutation.mutate(deleteTarget.id);
    setDeleteTarget(null);
  }, [deleteTarget, deleteMutation]);

  const openNew = useCallback(() => {
    setSlideLivrable(null);
    setSlideMode('new');
    setSlideOpen(true);
  }, []);

  const openView = useCallback((l: Livrable) => {
    setSlideLivrable(l);
    setSlideMode('view');
    setSlideOpen(true);
  }, []);

  const openEdit = useCallback((l: Livrable) => {
    setSlideLivrable(l);
    setSlideMode('edit');
    setSlideOpen(true);
  }, []);

  // ── Exports ────────────────────────────────────────────────────────────────

  const exportCSV = useCallback(() => {
    const bom = '﻿';
    const headers = ['Code', 'Nom', 'Catégorie', 'Composante', 'Responsable',
      'Date prévue', 'Date réelle', 'Avancement (%)', 'Statut', 'Priorité'];
    const rows = livrables.map(l => [
      l.code_livrable, l.nom, l.categorie, l.composante ?? '', l.responsable,
      l.date_prevue, l.date_reelle ?? '', String(l.avancement),
      STATUT_LABEL[l.statut], PRIORITE_LABEL[l.priorite],
    ]);
    const csv = bom + [headers, ...rows]
      .map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(';'))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'livrables.csv'; a.click();
    URL.revokeObjectURL(url);
  }, [livrables]);

  const exportXLSX = useCallback(() => {
    const headers = ['Code', 'Nom', 'Catégorie', 'Composante', 'Responsable',
      'Date prévue', 'Date réelle', 'Avancement (%)', 'Statut', 'Priorité'];
    const rows = livrables.map(l => [
      l.code_livrable, l.nom, l.categorie, l.composante ?? '', l.responsable,
      l.date_prevue, l.date_reelle ?? '', l.avancement,
      STATUT_LABEL[l.statut], PRIORITE_LABEL[l.priorite],
    ]);
    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Livrables');
    XLSX.writeFile(wb, 'livrables.xlsx');
  }, [livrables]);

  // ── Column definitions ─────────────────────────────────────────────────────

  const columns = useMemo<ColumnDef<Livrable, unknown>[]>(() => [
    {
      accessorKey: 'code_livrable',
      header: 'Code',
      meta: { isSticky: true } as Record<string, unknown>,
      cell: ({ getValue }) => (
        <span className="font-mono text-[11px] text-muted-foreground whitespace-nowrap">
          {getValue() as string}
        </span>
      ),
    },
    {
      accessorKey: 'nom',
      header: 'Livrable',
      cell: ({ row }) => {
        const { nom, composante } = row.original;
        return (
          <div className="flex flex-col gap-0.5 min-w-[200px] max-w-[300px]">
            <span className="text-[13px] font-semibold text-foreground leading-snug line-clamp-2" title={nom}>
              {nom}
            </span>
            {composante && (
              <span className="text-[10px] text-muted-foreground truncate">{composante}</span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'categorie',
      header: 'Catégorie',
      cell: ({ getValue }) => (
        <Badge variant="outline" className="text-[10px] whitespace-nowrap">
          {getValue() as string}
        </Badge>
      ),
    },
    {
      accessorKey: 'responsable',
      header: 'Responsable',
      cell: ({ getValue }) => {
        const name = getValue() as string;
        const initials = name.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase();
        return (
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold shrink-0">
              {initials}
            </div>
            <span className="text-[12px] text-foreground truncate max-w-[120px]">{name}</span>
          </div>
        );
      },
    },
    {
      accessorKey: 'date_prevue',
      header: 'Date prévue',
      meta: { align: 'center' } as Record<string, unknown>,
      cell: ({ row }) => {
        const late = isLate(row.original, today);
        return (
          <span className={`font-mono text-[11px] ${late ? 'text-destructive font-semibold' : 'text-muted-foreground'}`}>
            {fmt(row.original.date_prevue)}
          </span>
        );
      },
    },
    {
      accessorKey: 'date_reelle',
      header: 'Date réelle',
      meta: { align: 'center' } as Record<string, unknown>,
      cell: ({ getValue }) => (
        <span className="font-mono text-[11px] text-muted-foreground">{fmt(getValue() as string | undefined)}</span>
      ),
    },
    {
      accessorKey: 'avancement',
      header: 'Avancement',
      cell: ({ getValue }) => {
        const pct = getValue() as number;
        return (
          <div className="flex flex-col gap-1 min-w-[80px]">
            <span className="font-mono text-[11px] font-semibold text-foreground">{pct}%</span>
            <ProgressBar value={pct} size="xs" color={avancementColor(pct)} />
          </div>
        );
      },
    },
    {
      accessorKey: 'statut',
      header: 'Statut',
      cell: ({ getValue }) => {
        const s = getValue() as StatutLivrable;
        return (
          <Badge variant={statutVariant(s)} className="text-[10px] whitespace-nowrap">
            {STATUT_LABEL[s]}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'priorite',
      header: 'Priorité',
      cell: ({ getValue }) => {
        const p = getValue() as PrioriteLivrable;
        return (
          <Badge variant={prioriteVariant(p)} className="text-[10px] whitespace-nowrap">
            {PRIORITE_LABEL[p]}
          </Badge>
        );
      },
    },
    {
      id: 'actions',
      enableHiding: false,
      meta: { align: 'right' } as Record<string, unknown>,
      cell: ({ row }) => (
        <div className="flex items-center gap-1 justify-end">
          <Button variant="ghost" size="sm" aria-label="Voir" onClick={() => openView(row.original)}>
            <Eye className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="sm" aria-label="Modifier" onClick={() => openEdit(row.original)}>
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost" size="sm" aria-label="Supprimer"
            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={() => handleDeleteRequest(row.original)}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      ),
    },
  ], [today, openView, openEdit, handleDeleteRequest]);

  // ── Filters config ─────────────────────────────────────────────────────────

  const filters = useMemo(() => [
    {
      id: 'statut',
      title: 'Statut',
      options: STATUT_LIVRABLE_OPTIONS.map(o => ({ label: o.label, value: o.value })),
    },
    {
      id: 'responsable',
      title: 'Responsable',
      options: responsableOptions,
    },
    {
      id: 'categorie',
      title: 'Catégorie',
      options: LIVRABLE_CATEGORIES.map(c => ({ label: c, value: c })),
    },
    {
      id: 'priorite',
      title: 'Priorité',
      options: PRIORITE_LIVRABLE_OPTIONS.map(o => ({ label: o.label, value: o.value })),
    },
  ], [responsableOptions]);

  // ── JSX ────────────────────────────────────────────────────────────────────

  return (
    <section aria-label="Registre des Livrables" className="flex flex-col gap-6">

      {/* ── En-tête ──────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-border">
        <div>
          <h1 className="text-base font-bold text-foreground">Registre des Livrables</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Suivi de la production, validation et livraison des livrables du projet
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-8 text-xs" onClick={exportCSV}>
            <Download className="h-3.5 w-3.5 mr-1.5" aria-hidden="true" />
            CSV
          </Button>
          <Button variant="outline" size="sm" className="h-8 text-xs" onClick={exportXLSX}>
            <FileSpreadsheet className="h-3.5 w-3.5 mr-1.5" aria-hidden="true" />
            Excel
          </Button>
          <Button size="sm" className="h-8 text-xs" onClick={openNew}>
            <Plus className="h-3.5 w-3.5 mr-1.5" aria-hidden="true" />
            Nouveau livrable
          </Button>
        </div>
      </div>

      {/* ── Alerte livrables en retard ────────────────────────────────────── */}
      {livrablesenRetard.length > 0 && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 flex items-start gap-3">
          <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 shrink-0" aria-hidden="true" />
          <div>
            <p className="text-sm font-semibold text-destructive">
              {livrablesenRetard.length} livrable{livrablesenRetard.length > 1 ? 's' : ''} en retard
            </p>
            <p className="text-xs text-destructive/80 mt-0.5">
              {livrablesenRetard.map(l => l.code_livrable).join(', ')} — Date(s) prévue(s) dépassée(s)
            </p>
          </div>
        </div>
      )}

      {/* ── KPIs ─────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title="Total livrables"
          value={kpis.total}
          icon={<Package className="h-4 w-4" aria-hidden="true" />}
          iconVariant="primary"
          description="Dans le registre"
        />
        <StatCard
          title="Terminés"
          value={kpis.termine}
          icon={<CheckCircle2 className="h-4 w-4" aria-hidden="true" />}
          iconVariant="success"
          description="Validés ou terminés"
        />
        <StatCard
          title="En cours"
          value={kpis.enCours}
          icon={<Clock className="h-4 w-4" aria-hidden="true" />}
          iconVariant="warning"
          description="En cours ou soumis"
        />
        <StatCard
          title="En retard"
          value={kpis.enRetard}
          icon={<AlertTriangle className="h-4 w-4" aria-hidden="true" />}
          iconVariant="destructive"
          description="Échéance dépassée"
        />
        <StatCard
          title="Taux d'achèvement"
          value={`${kpis.tauxAchevement}%`}
          icon={<TrendingUp className="h-4 w-4" aria-hidden="true" />}
          iconVariant="info"
          description="Livrables terminés / total"
        />
      </div>

      {/* ── Graphiques ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Répartition par statut */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Répartition par statut</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={statutChartData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                  axisLine={false} tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                  axisLine={false} tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    background: 'hsl(var(--popover))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: 6,
                    fontSize: 11,
                  }}
                  formatter={(v) => [`${v}`, 'Livrables']}
                  cursor={{ fill: 'hsl(var(--muted))', opacity: 0.5 }}
                />
                <Bar dataKey="Nombre" fill="hsl(var(--primary))" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Répartition par catégorie */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Répartition par catégorie</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={categorieChartData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 9 }}
                  axisLine={false} tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                  axisLine={false} tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    background: 'hsl(var(--popover))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: 6,
                    fontSize: 11,
                  }}
                  formatter={(v) => [`${v}`, 'Livrables']}
                  cursor={{ fill: 'hsl(var(--muted))', opacity: 0.5 }}
                />
                <Bar dataKey="Nombre" fill="hsl(var(--secondary-foreground))" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Évolution mensuelle des terminés */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Évolution mensuelle des terminés</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={evolutionData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="label"
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                  axisLine={false} tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                  axisLine={false} tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    background: 'hsl(var(--popover))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: 6,
                    fontSize: 11,
                  }}
                  formatter={(v) => [`${v}`, 'Terminés']}
                />
                <Legend
                  wrapperStyle={{ fontSize: 11, color: 'hsl(var(--muted-foreground))' }}
                />
                <Line
                  type="monotone"
                  dataKey="Terminés"
                  stroke="hsl(var(--success))"
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--success))', r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* ── DataTable ─────────────────────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-base">Registre complet</CardTitle>
          <Button size="sm" className="h-7 text-xs" onClick={openNew}>
            <Plus className="h-3.5 w-3.5 mr-1" aria-hidden="true" />
            Ajouter
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <DataTable
            columns={columns}
            data={livrables}
            isLoading={isLoading}
            searchKey="nom"
            searchPlaceholder="Rechercher un livrable…"
            filters={filters}
          />
        </CardContent>
      </Card>

      {/* ── SlideOver ─────────────────────────────────────────────────────── */}
      <LivrableSlideOver
        open={slideOpen}
        onOpenChange={setSlideOpen}
        mode={slideMode}
        livrable={slideLivrable}
        nextCode={currentNextCode}
        onSave={handleSave}
        onDelete={(id) => {
          const target = livrables.find(l => l.id === id);
          if (target) { setSlideOpen(false); setDeleteTarget(target); }
        }}
      />

      {/* ── Modal de confirmation de suppression ──────────────────────────── */}
      <Modal open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <ModalContent>
          <ModalHeader>
            <ModalTitle>Supprimer le livrable</ModalTitle>
            <ModalDescription>
              Êtes-vous sûr de vouloir supprimer{' '}
              <strong>{deleteTarget?.code_livrable}</strong> —{' '}
              <em>{deleteTarget?.nom}</em> ? Cette action est irréversible.
            </ModalDescription>
          </ModalHeader>
          <ModalFooter>
            <ModalClose asChild>
              <Button variant="outline">Annuler</Button>
            </ModalClose>
            <Button variant="destructive" onClick={handleDeleteConfirm}>
              Supprimer
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

    </section>
  );
}
