import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import * as XLSX from 'xlsx';
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import type { ColumnDef } from '@tanstack/react-table';
import {
  FileText, CheckCircle2, Clock, AlertCircle, TrendingDown,
  Download, FileSpreadsheet, Plus, Eye, Pencil, Trash2,
} from 'lucide-react';
import type { RapportProjet, TypeRapport, StatutRapport, FormatRapport } from '@/types';
import {
  TYPE_RAPPORT_LABEL, TYPE_RAPPORT_OPTIONS,
  STATUT_RAPPORT_OPTIONS, FORMAT_RAPPORT_OPTIONS,
} from '@/mocks/reportsMocks';
import { useReports, useCreateReport, useUpdateReport, useDeleteReport } from '@/hooks/useReports';
import { useUIStore } from '@/stores/uiStore';
import { ReportSlideOver } from './reports/ReportSlideOver';
import type { ReportSavePayload } from './reports/ReportSlideOver';
import { DataTable }  from '@/components/ui/data-table/DataTable';
import { StatCard }   from '@/components/ui/data-display/StatCard';
import { Badge }      from '@/components/ui/data-display/Badge';
import { Button }     from '@/components/ui/forms/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/data-display/Card';
import {
  Modal, ModalContent, ModalHeader, ModalTitle,
  ModalDescription, ModalFooter, ModalClose,
} from '@/components/ui/overlays/Modal';

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUT_LABEL: Record<StatutRapport, string> = {
  GENERE:     'Généré',
  EN_ATTENTE: 'En attente',
  VALIDE:     'Validé',
  ARCHIVE:    'Archivé',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(iso?: string): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch { return '—'; }
}

function statutVariant(s: StatutRapport): 'outline' | 'warning' | 'success' | 'secondary' | 'info' {
  if (s === 'VALIDE')     return 'success';
  if (s === 'EN_ATTENTE') return 'warning';
  if (s === 'GENERE')     return 'info';
  return 'secondary';
}

function formatVariant(f: FormatRapport): 'destructive' | 'success' | 'default' {
  if (f === 'PDF')   return 'destructive';
  if (f === 'Excel') return 'success';
  return 'default';
}

function formatToExt(f: FormatRapport): string {
  const map: Record<FormatRapport, string> = { PDF: 'pdf', Excel: 'xlsx', Word: 'docx' };
  return map[f];
}

function simulateDownload(rapport: RapportProjet) {
  const ext     = formatToExt(rapport.format);
  const content = `Rapport: ${rapport.titre}\nCode: ${rapport.code_rapport}\nType: ${rapport.type}\nPériode: ${rapport.periode}\nAuteur: ${rapport.auteur}\nStatut: ${rapport.statut}`;
  const blob    = new Blob([content], { type: 'text/plain;charset=utf-8;' });
  const url     = URL.createObjectURL(blob);
  const a       = document.createElement('a');
  a.href     = url;
  a.download = `${rapport.code_rapport}_${rapport.titre.replace(/\s+/g, '_')}.${ext}`;
  a.click();
  URL.revokeObjectURL(url);
}

function nextReportCode(rapports: RapportProjet[]): string {
  const max = rapports.reduce((m, r) => {
    const n = parseInt(r.code_rapport.replace('RPT-', ''), 10);
    return isNaN(n) ? m : Math.max(m, n);
  }, 0);
  return `RPT-${String(max + 1).padStart(3, '0')}`;
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function TabReports() {
  const { id: urlProjectId } = useParams<{ id: string }>();
  const activeProjectId = useUIStore(s => s.activeProjectId);
  const resolvedProjectId = urlProjectId || activeProjectId || '';

  const { data: apiRapports, isLoading } = useReports(resolvedProjectId);
  const createMutation = useCreateReport(resolvedProjectId);
  const updateMutation = useUpdateReport(resolvedProjectId);
  const deleteMutation = useDeleteReport(resolvedProjectId);

  const [rapports, setRapports]   = useState<RapportProjet[]>([]);
  const [slideOpen, setSlideOpen] = useState(false);
  const [slideMode, setSlideMode] = useState<'new' | 'edit' | 'view'>('new');
  const [slideRpt,  setSlideRpt]  = useState<RapportProjet | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<RapportProjet | null>(null);

  useEffect(() => {
    if (apiRapports) setRapports(apiRapports);
  }, [apiRapports]);

  // ── KPIs ──────────────────────────────────────────────────────────────────

  const kpis = useMemo(() => {
    const today      = new Date().toISOString().slice(0, 7);
    const ceMois     = rapports.filter(r => r.date_generation.startsWith(today)).length;
    const valides    = rapports.filter(r => r.statut === 'VALIDE').length;
    const enAttente  = rapports.filter(r => r.statut === 'EN_ATTENTE').length;
    const totalDl    = rapports.reduce((s, r) => s + r.nb_telechargements, 0);
    return { total: rapports.length, ceMois, valides, enAttente, totalDl };
  }, [rapports]);

  const rapportsEnAttente = useMemo(
    () => rapports.filter(r => r.statut === 'EN_ATTENTE'),
    [rapports],
  );

  const currentNextCode = useMemo(() => nextReportCode(rapports), [rapports]);

  // ── Chart data ─────────────────────────────────────────────────────────────

  const typeChartData = useMemo(() =>
    TYPE_RAPPORT_OPTIONS
      .map(t => ({ name: t.label, Rapports: rapports.filter(r => r.type === t.value).length }))
      .filter(d => d.Rapports > 0),
  [rapports]);

  const generationData = useMemo(() => {
    const months: { label: string; Générés: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const dt = new Date();
      dt.setDate(1);
      dt.setMonth(dt.getMonth() - i);
      const mois  = dt.toISOString().slice(0, 7);
      const label = dt.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' });
      months.push({ label, Générés: rapports.filter(r => r.date_generation.startsWith(mois)).length });
    }
    return months;
  }, [rapports]);

  const telechargementData = useMemo(() => {
    const months: { label: string; Téléchargements: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const dt = new Date();
      dt.setDate(1);
      dt.setMonth(dt.getMonth() - i);
      const mois  = dt.toISOString().slice(0, 7);
      const label = dt.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' });
      const dl    = rapports
        .filter(r => r.date_telechargement?.startsWith(mois))
        .reduce((s, r) => s + r.nb_telechargements, 0);
      months.push({ label, Téléchargements: dl });
    }
    return months;
  }, [rapports]);

  // ── Filters ────────────────────────────────────────────────────────────────

  const auteurOptions = useMemo(() => {
    const unique = [...new Set(rapports.map(r => r.auteur))].sort();
    return unique.map(a => ({ label: a, value: a }));
  }, [rapports]);

  const periodeOptions = useMemo(() => {
    const unique = [...new Set(rapports.map(r => r.periode))].sort();
    return unique.map(p => ({ label: p, value: p }));
  }, [rapports]);

  const tableFilters = useMemo(() => [
    {
      id: 'type',
      title: 'Type',
      options: TYPE_RAPPORT_OPTIONS.map(o => ({ label: o.label, value: o.value })),
    },
    {
      id: 'statut',
      title: 'Statut',
      options: STATUT_RAPPORT_OPTIONS.map(o => ({ label: o.label, value: o.value })),
    },
    {
      id: 'auteur',
      title: 'Auteur',
      options: auteurOptions,
    },
    {
      id: 'format',
      title: 'Format',
      options: FORMAT_RAPPORT_OPTIONS.map(o => ({ label: o.label, value: o.value })),
    },
    {
      id: 'periode',
      title: 'Période',
      options: periodeOptions,
    },
  ], [auteurOptions, periodeOptions]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleSave = useCallback((payload: ReportSavePayload, id?: string) => {
    const now = new Date().toISOString();
    if (id) {
      setRapports(prev => prev.map(r =>
        r.id === id ? { ...r, ...payload, updatedAt: now } : r,
      ));
      updateMutation.mutate({ id, ...payload });
    } else {
      const newRapport: RapportProjet = {
        id: `rpt-${Date.now()}`,
        projet_id: resolvedProjectId,
        ...payload,
        createdAt: now,
        updatedAt: now,
      };
      setRapports(prev => [newRapport, ...prev]);
      simulateDownload(newRapport);
      createMutation.mutate({ ...payload, projet_id: resolvedProjectId });
    }
  }, [updateMutation, createMutation, resolvedProjectId]);

  const handleDeleteConfirm = useCallback(() => {
    if (!deleteTarget) return;
    setRapports(prev => prev.filter(r => r.id !== deleteTarget.id));
    deleteMutation.mutate(deleteTarget.id);
    setDeleteTarget(null);
  }, [deleteTarget, deleteMutation]);

  const handleDuplicate = useCallback((id: string) => {
    const now = new Date().toISOString();
    setRapports(prev => {
      const original = prev.find(r => r.id === id);
      if (!original) return prev;
      const copy: RapportProjet = {
        ...original,
        id: `rpt-${Date.now()}`,
        code_rapport: nextReportCode(prev),
        titre: `${original.titre} (copie)`,
        statut: 'GENERE',
        version: '1.0',
        nb_telechargements: 0,
        date_generation: now.slice(0, 10),
        date_telechargement: undefined,
        createdAt: now,
        updatedAt: now,
      };
      return [copy, ...prev];
    });
  }, []);

  const handleArchive = useCallback((id: string) => {
    const now = new Date().toISOString();
    setRapports(prev => {
      const current = prev.find(r => r.id === id);
      const nextStatut: StatutRapport = current?.statut === 'ARCHIVE' ? 'VALIDE' : 'ARCHIVE';
      updateMutation.mutate({ id, statut: nextStatut });
      return prev.map(r =>
        r.id === id ? { ...r, statut: nextStatut, updatedAt: now } : r,
      );
    });
  }, [updateMutation]);

  const handleDownload = useCallback((id: string) => {
    const now = new Date().toISOString();
    setRapports(prev => {
      const current = prev.find(r => r.id === id);
      if (current) {
        updateMutation.mutate({
          id,
          nb_telechargements: current.nb_telechargements + 1,
          date_telechargement: now.slice(0, 10),
        });
      }
      return prev.map(r =>
        r.id === id ? {
          ...r,
          nb_telechargements: r.nb_telechargements + 1,
          date_telechargement: now.slice(0, 10),
          updatedAt: now,
        } : r,
      );
    });
  }, [updateMutation]);

  const openNew  = useCallback(() => { setSlideRpt(null); setSlideMode('new');  setSlideOpen(true); }, []);
  const openView = useCallback((r: RapportProjet) => { setSlideRpt(r); setSlideMode('view'); setSlideOpen(true); }, []);
  const openEdit = useCallback((r: RapportProjet) => { setSlideRpt(r); setSlideMode('edit'); setSlideOpen(true); }, []);

  // ── Exports ────────────────────────────────────────────────────────────────

  const exportCSV = useCallback(() => {
    const bom     = '﻿';
    const headers = ['Code', 'Titre', 'Type', 'Période', 'Auteur', 'Date génération',
      'Format', 'Version', 'Statut', 'Téléchargements', 'Taille (Ko)', 'Commentaires'];
    const rows = rapports.map(r => [
      r.code_rapport, r.titre, TYPE_RAPPORT_LABEL[r.type], r.periode, r.auteur,
      r.date_generation, r.format, r.version, STATUT_LABEL[r.statut],
      String(r.nb_telechargements), String(r.taille_ko), r.commentaires ?? '',
    ]);
    const csv  = bom + [headers, ...rows].map(row => row.map(c => `"${String(c).replace(/"/g, '""')}"`).join(';')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = 'rapports.csv'; a.click();
    URL.revokeObjectURL(url);
  }, [rapports]);

  const exportXLSX = useCallback(() => {
    const headers = ['Code', 'Titre', 'Type', 'Période', 'Auteur', 'Date génération',
      'Format', 'Version', 'Statut', 'Téléchargements', 'Taille (Ko)', 'Commentaires'];
    const rows = rapports.map(r => [
      r.code_rapport, r.titre, TYPE_RAPPORT_LABEL[r.type], r.periode, r.auteur,
      r.date_generation, r.format, r.version, STATUT_LABEL[r.statut],
      r.nb_telechargements, r.taille_ko, r.commentaires ?? '',
    ]);
    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Rapports');
    XLSX.writeFile(wb, 'rapports.xlsx');
  }, [rapports]);

  // ── Column definitions ─────────────────────────────────────────────────────

  const columns = useMemo<ColumnDef<RapportProjet, unknown>[]>(() => [
    {
      accessorKey: 'code_rapport',
      header: 'Code',
      meta: { isSticky: true } as Record<string, unknown>,
      cell: ({ getValue }) => (
        <span className="font-mono text-[11px] text-muted-foreground whitespace-nowrap">
          {getValue() as string}
        </span>
      ),
    },
    {
      accessorKey: 'titre',
      header: 'Titre',
      cell: ({ row }) => {
        const { titre, description } = row.original;
        return (
          <div className="flex flex-col gap-0.5 min-w-[200px] max-w-[320px]">
            <span className="text-[13px] font-semibold text-foreground leading-snug line-clamp-2" title={titre}>
              {titre}
            </span>
            {description && (
              <span className="text-[10px] text-muted-foreground truncate">{description}</span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'type',
      header: 'Type',
      cell: ({ getValue }) => (
        <Badge variant="outline" className="text-[10px] whitespace-nowrap">
          {TYPE_RAPPORT_LABEL[getValue() as TypeRapport]}
        </Badge>
      ),
    },
    {
      accessorKey: 'periode',
      header: 'Période',
      cell: ({ getValue }) => (
        <span className="text-[12px] font-medium text-foreground whitespace-nowrap">
          {getValue() as string}
        </span>
      ),
    },
    {
      accessorKey: 'auteur',
      header: 'Auteur',
      cell: ({ getValue }) => {
        const name     = getValue() as string;
        const initials = name.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase();
        return (
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold shrink-0">
              {initials}
            </div>
            <span className="text-[12px] text-foreground truncate max-w-[110px]">{name}</span>
          </div>
        );
      },
    },
    {
      accessorKey: 'date_generation',
      header: 'Généré le',
      meta: { align: 'center' } as Record<string, unknown>,
      cell: ({ getValue }) => (
        <span className="font-mono text-[11px] text-muted-foreground whitespace-nowrap">
          {fmtDate(getValue() as string)}
        </span>
      ),
    },
    {
      accessorKey: 'format',
      header: 'Format',
      cell: ({ getValue }) => {
        const f = getValue() as FormatRapport;
        return <Badge variant={formatVariant(f)} className="text-[10px] font-mono whitespace-nowrap">{f}</Badge>;
      },
    },
    {
      accessorKey: 'version',
      header: 'Version',
      meta: { align: 'center' } as Record<string, unknown>,
      cell: ({ getValue }) => (
        <span className="font-mono text-[11px] text-muted-foreground whitespace-nowrap">
          v{getValue() as string}
        </span>
      ),
    },
    {
      accessorKey: 'statut',
      header: 'Statut',
      cell: ({ getValue }) => {
        const s = getValue() as StatutRapport;
        return <Badge variant={statutVariant(s)} className="text-[10px] whitespace-nowrap">{STATUT_LABEL[s]}</Badge>;
      },
    },
    {
      accessorKey: 'nb_telechargements',
      header: 'Téléch.',
      meta: { align: 'right' } as Record<string, unknown>,
      cell: ({ getValue }) => (
        <span className="font-mono text-[11px] text-muted-foreground whitespace-nowrap">
          {getValue() as number}
        </span>
      ),
    },
    {
      id: 'actions',
      enableHiding: false,
      meta: { align: 'right', isStickyRight: true } as Record<string, unknown>,
      cell: ({ row }) => (
        <div className="flex items-center gap-1 justify-end">
          <Button variant="ghost" size="sm" aria-label="Télécharger"
            onClick={() => { simulateDownload(row.original); handleDownload(row.original.id); }}>
            <Download className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="sm" aria-label="Aperçu" onClick={() => openView(row.original)}>
            <Eye className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="sm" aria-label="Modifier" onClick={() => openEdit(row.original)}>
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost" size="sm" aria-label="Supprimer"
            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={() => setDeleteTarget(row.original)}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      ),
    },
  ], [openView, openEdit, handleDownload]);

  // ── JSX ────────────────────────────────────────────────────────────────────

  return (
    <section aria-label="Centre de Rapports" className="flex flex-col gap-6">

      {/* ── En-tête ──────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-border">
        <div>
          <h1 className="text-base font-bold text-foreground">Centre de Rapports</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Génération et suivi des rapports du projet
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
            Générer un rapport
          </Button>
        </div>
      </div>

      {/* ── Alerte EN_ATTENTE ─────────────────────────────────────────────── */}
      {rapportsEnAttente.length > 0 && (
        <div className="rounded-lg border border-warning/30 bg-warning/5 px-4 py-3 flex items-start gap-3">
          <AlertCircle className="h-4 w-4 text-warning mt-0.5 shrink-0" aria-hidden="true" />
          <div>
            <p className="text-sm font-semibold text-warning">
              {rapportsEnAttente.length} rapport{rapportsEnAttente.length > 1 ? 's' : ''} en attente de validation
            </p>
            <p className="text-xs text-warning/80 mt-0.5">
              {rapportsEnAttente.map(r => r.code_rapport).join(', ')} — à examiner et valider
            </p>
          </div>
        </div>
      )}

      {/* ── KPIs ─────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title="Total rapports"
          value={kpis.total}
          icon={<FileText className="h-4 w-4 text-primary" aria-hidden="true" />}
          iconVariant="primary"
          description="Dans le registre"
        />
        <StatCard
          title="Générés ce mois"
          value={kpis.ceMois}
          icon={<Plus className="h-4 w-4 text-success" aria-hidden="true" />}
          iconVariant="success"
          description="Ce mois-ci"
        />
        <StatCard
          title="Validés"
          value={kpis.valides}
          icon={<CheckCircle2 className="h-4 w-4 text-success" aria-hidden="true" />}
          iconVariant="success"
          description="Approuvés"
        />
        <StatCard
          title="En attente"
          value={kpis.enAttente}
          icon={<Clock className="h-4 w-4 text-warning" aria-hidden="true" />}
          iconVariant="warning"
          description="À valider"
        />
        <StatCard
          title="Téléchargements"
          value={kpis.totalDl}
          icon={<TrendingDown className="h-4 w-4 text-info" aria-hidden="true" />}
          iconVariant="info"
          description="Total cumulé"
        />
      </div>

      {/* ── Graphiques ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Répartition par type */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Par type</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={typeChartData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 9 }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: 6, fontSize: 11 }}
                  formatter={(v) => [`${v}`, 'Rapports']}
                  cursor={{ fill: 'hsl(var(--muted))', opacity: 0.5 }}
                />
                <Bar dataKey="Rapports" fill="hsl(var(--primary))" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Génération mensuelle */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Générés par mois</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={generationData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="label" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: 6, fontSize: 11 }}
                  formatter={(v) => [`${v}`, 'Générés']}
                />
                <Legend wrapperStyle={{ fontSize: 11, color: 'hsl(var(--muted-foreground))' }} />
                <Line type="monotone" dataKey="Générés" stroke="hsl(var(--primary))" strokeWidth={2}
                  dot={{ fill: 'hsl(var(--primary))', r: 3 }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Téléchargements par mois */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Téléchargements par mois</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={telechargementData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="label" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: 6, fontSize: 11 }}
                  formatter={(v) => [`${v}`, 'Téléchargements']}
                />
                <Legend wrapperStyle={{ fontSize: 11, color: 'hsl(var(--muted-foreground))' }} />
                <Line type="monotone" dataKey="Téléchargements" stroke="hsl(var(--secondary-foreground))" strokeWidth={2}
                  dot={{ fill: 'hsl(var(--secondary-foreground))', r: 3 }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* ── DataTable ─────────────────────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-base">Registre des rapports</CardTitle>
          <Button size="sm" className="h-7 text-xs" onClick={openNew}>
            <Plus className="h-3.5 w-3.5 mr-1" aria-hidden="true" />
            Générer
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <DataTable
            columns={columns}
            data={rapports}
            searchKey="titre"
            searchPlaceholder="Rechercher un rapport…"
            filters={tableFilters}
            isLoading={isLoading}
          />
        </CardContent>
      </Card>

      {/* ── SlideOver ─────────────────────────────────────────────────────── */}
      <ReportSlideOver
        open={slideOpen}
        onOpenChange={setSlideOpen}
        mode={slideMode}
        rapport={slideRpt}
        nextCode={currentNextCode}
        onSave={handleSave}
        onDelete={(id) => {
          const target = rapports.find(r => r.id === id);
          if (target) { setSlideOpen(false); setDeleteTarget(target); }
        }}
        onDuplicate={handleDuplicate}
        onDownload={handleDownload}
        onArchive={handleArchive}
      />

      {/* ── Modal suppression ─────────────────────────────────────────────── */}
      <Modal open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <ModalContent>
          <ModalHeader>
            <ModalTitle>Supprimer le rapport</ModalTitle>
            <ModalDescription>
              Êtes-vous sûr de vouloir supprimer{' '}
              <strong>{deleteTarget?.code_rapport}</strong> —{' '}
              <em>{deleteTarget?.titre}</em> ? Cette action est irréversible.
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
