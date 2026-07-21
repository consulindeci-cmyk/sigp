import { useCallback, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import * as XLSX from 'xlsx';
import {
  BarChart, Bar, PieChart, Pie, Cell, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import type { ColumnDef } from '@tanstack/react-table';
import {
  Settings, CheckCircle2, Clock, AlertTriangle, LayoutGrid,
  AlertCircle, Download, FileSpreadsheet, Plus, Eye, Pencil,
  Trash2, RotateCcw, Copy,
} from 'lucide-react';
import type { ConfigurationProjet, CategorieParametre, StatutParametre } from '@/types';
import {
  CATEGORIE_PARAM_OPTIONS, STATUT_PARAM_OPTIONS, STATUT_PARAM_LABEL,
} from '@/mocks/settingsMocks';
import { useUIStore } from '@/stores/uiStore';
import { useAuthStore } from '@/stores/authStore';
import {
  useProjectSettings, useCreateProjectSetting, useUpdateProjectSetting, useDeleteProjectSetting,
} from '@/hooks/useProjectSettings';
import { SettingSlideOver } from './settings/SettingSlideOver';
import type { SettingSavePayload } from './settings/SettingSlideOver';
import { DataTable }  from '@/components/ui/data-table/DataTable';
import { StatCard }   from '@/components/ui/data-display/StatCard';
import { Badge }      from '@/components/ui/data-display/Badge';
import { Button }     from '@/components/ui/forms/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/data-display/Card';
import {
  Modal, ModalContent, ModalHeader, ModalTitle,
  ModalDescription, ModalFooter, ModalClose,
} from '@/components/ui/overlays/Modal';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch { return '—'; }
}

function statutVariant(s: StatutParametre): 'default' | 'success' | 'warning' | 'secondary' | 'destructive' | 'info' {
  if (s === 'ACTIF')      return 'success';
  if (s === 'INACTIF')    return 'secondary';
  if (s === 'EN_ATTENTE') return 'warning';
  if (s === 'OBSOLETE')   return 'destructive';
  return 'default';
}

const PIE_COLORS = [
  'hsl(var(--success))',
  'hsl(var(--muted-foreground))',
  'hsl(var(--warning))',
  'hsl(var(--destructive))',
];

// ─── Main component ───────────────────────────────────────────────────────────

export default function TabSettings() {
  const { id: urlProjectId } = useParams<{ id: string }>();
  const activeProjectId = useUIStore(s => s.activeProjectId);
  const projectId = urlProjectId || activeProjectId || '';

  const { data: configs = [] } = useProjectSettings(projectId);
  const createMutation = useCreateProjectSetting(projectId);
  const updateMutation = useUpdateProjectSetting(projectId);
  const deleteMutation = useDeleteProjectSetting(projectId);

  // Miroir de requireRole(profile, [...]) sur settings-create/update
  // (COORDINATEUR/CHARGE_PROGRAMME/ADMIN/SUPER_ADMIN) et -delete (ADMIN/SUPER_ADMIN).
  const currentRole = useAuthStore(s => s.user?.role);
  const canManage = !!currentRole && ['COORDINATEUR', 'CHARGE_PROGRAMME', 'ADMIN', 'SUPER_ADMIN'].includes(currentRole);
  const canDelete = currentRole === 'ADMIN' || currentRole === 'SUPER_ADMIN';

  const [slideOpen, setSlideOpen]     = useState(false);
  const [slideMode, setSlideMode]     = useState<'new' | 'edit' | 'view'>('new');
  const [slideCfg,  setSlideCfg]      = useState<ConfigurationProjet | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ConfigurationProjet | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // ── KPIs ────────────────────────────────────────────────────────────────────

  const kpis = useMemo(() => {
    const il30j = new Date();
    il30j.setDate(il30j.getDate() - 30);
    const cutoff = il30j.toISOString().slice(0, 10);

    const actifs = configs.filter(c => c.statut === 'ACTIF').length;
    const recents = configs.filter(c => c.date_modification >= cutoff).length;
    const alertes = configs.filter(c =>
      c.statut === 'EN_ATTENTE' || (c.requis && c.statut === 'INACTIF'),
    ).length;
    const categories = new Set(
      configs.filter(c => c.statut === 'ACTIF').map(c => c.categorie),
    ).size;

    return { total: configs.length, actifs, recents, alertes, categories };
  }, [configs]);

  // ── Alerte paramètres problématiques ────────────────────────────────────────

  const alertParams = useMemo(
    () => configs.filter(c =>
      c.statut === 'EN_ATTENTE' || (c.requis && c.statut === 'INACTIF'),
    ),
    [configs],
  );

  // ── Données graphiques ───────────────────────────────────────────────────────

  const categorieData = useMemo(() =>
    CATEGORIE_PARAM_OPTIONS
      .map(o => ({
        name: o.label,
        Paramètres: configs.filter(c => c.categorie === o.value).length,
      }))
      .filter(d => d.Paramètres > 0),
  [configs]);

  const pieData = useMemo(() =>
    STATUT_PARAM_OPTIONS
      .map(o => ({
        name: STATUT_PARAM_LABEL[o.value],
        value: configs.filter(c => c.statut === o.value).length,
      }))
      .filter(d => d.value > 0),
  [configs]);

  const evolutionData = useMemo(() => {
    const months: { label: string; Modifications: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const dt = new Date();
      dt.setDate(1);
      dt.setMonth(dt.getMonth() - i);
      const mois  = dt.toISOString().slice(0, 7);
      const label = dt.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' });
      months.push({
        label,
        Modifications: configs.filter(c => c.date_modification.startsWith(mois)).length,
      });
    }
    return months;
  }, [configs]);

  // ── Filtres ──────────────────────────────────────────────────────────────────

  const auteurOptions = useMemo(() => {
    const unique = [...new Set(configs.map(c => c.modifie_par))].sort();
    return unique.map(a => ({ label: a, value: a }));
  }, [configs]);

  const moisOptions = useMemo(() => {
    const months = [...new Set(configs.map(c => c.date_modification.slice(0, 7)))].sort().reverse();
    return months.map(m => ({
      label: new Date(m + '-01').toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }),
      value: m,
    }));
  }, [configs]);

  const tableFilters = useMemo(() => [
    {
      id: 'categorie',
      title: 'Catégorie',
      options: CATEGORIE_PARAM_OPTIONS.map(o => ({ label: o.label, value: o.value as string })),
    },
    {
      id: 'statut',
      title: 'Statut',
      options: STATUT_PARAM_OPTIONS.map(o => ({ label: o.label, value: o.value as string })),
    },
    {
      id: 'modifie_par',
      title: 'Modifié par',
      options: auteurOptions,
    },
    {
      id: 'mois_modification',
      title: 'Période',
      options: moisOptions,
    },
  ], [auteurOptions, moisOptions]);

  // ── Handlers ─────────────────────────────────────────────────────────────────
  // Le parent possède les mutations et ne ferme le Modal qu'après confirmation
  // serveur (onSuccess) — plus de fermeture aveugle ni d'échec silencieux
  // (cf. audit Paramètres du Projet).

  function extractErrorMessage(err: unknown): string {
    return err instanceof Error ? err.message : 'Une erreur est survenue. Veuillez réessayer.';
  }

  const handleSave = useCallback((payload: SettingSavePayload, id?: string) => {
    setActionError(null);
    const onSettled = {
      onSuccess: () => setSlideOpen(false),
      onError: (err: unknown) => setActionError(extractErrorMessage(err)),
    };
    if (id) {
      updateMutation.mutate({ id, ...payload }, onSettled);
    } else {
      createMutation.mutate(payload, onSettled);
    }
  }, [createMutation, updateMutation]);

  const handleDeleteConfirm = useCallback(() => {
    if (!deleteTarget) return;
    setActionError(null);
    deleteMutation.mutate(deleteTarget.id, {
      onSuccess: () => setDeleteTarget(null),
      onError: (err) => setActionError(extractErrorMessage(err)),
    });
  }, [deleteTarget, deleteMutation]);

  const handleRestore = useCallback((cfg: ConfigurationProjet) => {
    setActionError(null);
    updateMutation.mutate(
      { id: cfg.id, statut: 'ACTIF' },
      { onError: (err) => setActionError(extractErrorMessage(err)) },
    );
  }, [updateMutation]);

  const handleDuplicate = useCallback((cfg: ConfigurationProjet) => {
    setActionError(null);
    createMutation.mutate(
      {
        categorie: cfg.categorie,
        nom: `${cfg.nom} (copie)`,
        description: cfg.description,
        valeur: cfg.valeur,
        valeurDefaut: cfg.valeur_defaut,
        typeValeur: cfg.type_valeur,
        requis: cfg.requis,
        modifiable: cfg.modifiable,
        statut: 'EN_ATTENTE',
      },
      {
        onSuccess: () => setSlideOpen(false),
        onError: (err) => setActionError(extractErrorMessage(err)),
      },
    );
  }, [createMutation]);

  const openNew  = useCallback(() => {
    setSlideCfg(null); setSlideMode('new'); setSlideOpen(true);
  }, []);
  const openView = useCallback((c: ConfigurationProjet) => {
    setSlideCfg(c); setSlideMode('view'); setSlideOpen(true);
  }, []);
  const openEdit = useCallback((c: ConfigurationProjet) => {
    setSlideCfg(c); setSlideMode('edit'); setSlideOpen(true);
  }, []);

  // ── Exports ──────────────────────────────────────────────────────────────────

  const exportCSV = useCallback(() => {
    const bom = '﻿';
    const headers = ['Code', 'Catégorie', 'Nom', 'Valeur', 'Valeur par défaut',
      'Type', 'Requis', 'Modifiable', 'Statut', 'Description', 'Modifié par', 'Date modification'];
    const rows = configs.map(c => [
      c.code_param, c.categorie, c.nom, c.valeur, c.valeur_defaut,
      c.type_valeur, c.requis ? 'Oui' : 'Non', c.modifiable ? 'Oui' : 'Non',
      STATUT_PARAM_LABEL[c.statut], c.description, c.modifie_par, c.date_modification,
    ]);
    const csv  = bom + [headers, ...rows].map(r =>
      r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(';'),
    ).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = 'parametres.csv'; a.click();
    URL.revokeObjectURL(url);
  }, [configs]);

  const exportXLSX = useCallback(() => {
    const headers = ['Code', 'Catégorie', 'Nom', 'Valeur', 'Valeur par défaut',
      'Type', 'Requis', 'Modifiable', 'Statut', 'Description', 'Modifié par', 'Date modification'];
    const rows = configs.map(c => [
      c.code_param, c.categorie, c.nom, c.valeur, c.valeur_defaut,
      c.type_valeur, c.requis ? 'Oui' : 'Non', c.modifiable ? 'Oui' : 'Non',
      STATUT_PARAM_LABEL[c.statut], c.description, c.modifie_par, c.date_modification,
    ]);
    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Paramètres');
    XLSX.writeFile(wb, 'parametres.xlsx');
  }, [configs]);

  // ── Colonnes ─────────────────────────────────────────────────────────────────

  const columns = useMemo<ColumnDef<ConfigurationProjet, unknown>[]>(() => [
    {
      accessorKey: 'categorie',
      header: 'Catégorie',
      meta: { isSticky: true } as Record<string, unknown>,
      cell: ({ getValue }) => (
        <Badge variant="outline" className="text-[10px] whitespace-nowrap">
          {getValue() as CategorieParametre}
        </Badge>
      ),
    },
    {
      accessorKey: 'nom',
      header: 'Nom',
      cell: ({ row }) => (
        <div className="flex flex-col gap-0 min-w-[160px]">
          <span className="text-[12px] font-semibold text-foreground">{row.original.nom}</span>
          <span className="font-mono text-[10px] text-muted-foreground">{row.original.code_param}</span>
        </div>
      ),
    },
    {
      accessorKey: 'valeur',
      header: 'Valeur',
      cell: ({ row }) => (
        <span className="font-mono text-[11px] bg-muted px-1.5 py-0.5 rounded truncate max-w-[120px] block"
          title={row.original.valeur}>
          {row.original.valeur || '—'}
        </span>
      ),
    },
    {
      accessorKey: 'description',
      header: 'Description',
      cell: ({ row }) => (
        <p className="text-[11px] text-muted-foreground line-clamp-2 max-w-[220px] leading-relaxed"
          title={row.original.description}>
          {row.original.description}
        </p>
      ),
    },
    {
      accessorKey: 'date_modification',
      header: 'Dernière modification',
      cell: ({ row }) => (
        <span className="font-mono text-[11px] whitespace-nowrap text-muted-foreground">
          {fmtDate(row.original.date_modification)}
        </span>
      ),
    },
    {
      accessorKey: 'modifie_par',
      header: 'Modifié par',
      cell: ({ row }) => {
        const name     = row.original.modifie_par;
        const initials = name.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase();
        return (
          <div className="flex items-center gap-1.5 min-w-[110px]">
            <div className="h-5 w-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[9px] font-bold shrink-0">
              {initials}
            </div>
            <span className="text-[11px] text-foreground truncate">{name}</span>
          </div>
        );
      },
    },
    {
      accessorKey: 'statut',
      header: 'Statut',
      cell: ({ getValue }) => {
        const s = getValue() as StatutParametre;
        return (
          <Badge variant={statutVariant(s)} className="text-[10px] whitespace-nowrap">
            {STATUT_PARAM_LABEL[s]}
          </Badge>
        );
      },
    },
    {
      id: 'mois_modification',
      accessorFn: (row: ConfigurationProjet) => row.date_modification.slice(0, 7),
      header: '',
      enableHiding: true,
      cell: () => null,
    },
    {
      id: 'actions',
      enableHiding: false,
      meta: { align: 'right', isStickyRight: true } as Record<string, unknown>,
      cell: ({ row }) => {
        const cfg = row.original;
        const canRestore = cfg.statut === 'INACTIF' || cfg.statut === 'OBSOLETE';
        return (
          <div className="flex items-center gap-1 justify-end">
            <Button variant="ghost" size="sm" aria-label="Voir" onClick={() => openView(cfg)}>
              <Eye className="h-3.5 w-3.5" />
            </Button>
            {canManage && (
              <Button variant="ghost" size="sm" aria-label="Modifier" onClick={() => openEdit(cfg)}>
                <Pencil className="h-3.5 w-3.5" />
              </Button>
            )}
            {canManage && canRestore && (
              <Button
                variant="ghost" size="sm" aria-label="Restaurer"
                className="text-success hover:bg-success/10 hover:text-success"
                onClick={() => handleRestore(cfg)}
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </Button>
            )}
            {canManage && (
              <Button
                variant="ghost" size="sm" aria-label="Dupliquer"
                className="text-muted-foreground hover:text-foreground"
                onClick={() => handleDuplicate(cfg)}
              >
                <Copy className="h-3.5 w-3.5" />
              </Button>
            )}
            {canDelete && (
              <Button
                variant="ghost" size="sm" aria-label="Supprimer"
                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                onClick={() => { setActionError(null); setDeleteTarget(cfg); }}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        );
      },
    },
  ], [openView, openEdit, handleRestore, handleDuplicate, canManage, canDelete]);

  // ── JSX ──────────────────────────────────────────────────────────────────────

  return (
    <section aria-label="Paramètres du projet" className="flex flex-col gap-6">

      {/* ── En-tête ──────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-border">
        <div>
          <h1 className="text-base font-bold text-foreground">Paramètres</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Configuration et administration du projet
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
          {canManage && (
            <Button size="sm" className="h-8 text-xs" onClick={openNew}>
              <Plus className="h-3.5 w-3.5 mr-1.5" aria-hidden="true" />
              Nouveau paramètre
            </Button>
          )}
        </div>
      </div>

      {actionError && (
        <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive" role="alert">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" aria-hidden="true" />
          <span>{actionError}</span>
        </div>
      )}

      {/* ── Alerte configuration ─────────────────────────────────────────────── */}
      {alertParams.length > 0 && (
        <div className="rounded-lg border border-warning/30 bg-warning/5 px-4 py-3 flex items-start gap-3">
          <AlertCircle className="h-4 w-4 text-warning mt-0.5 shrink-0" aria-hidden="true" />
          <div>
            <p className="text-sm font-semibold text-warning">
              {alertParams.length} paramètre{alertParams.length > 1 ? 's' : ''} nécessitent une attention
            </p>
            <ul className="mt-1 space-y-0.5">
              {alertParams.slice(0, 5).map(c => (
                <li key={c.id} className="text-xs text-warning/80">
                  <span className="font-mono">[{c.code_param}]</span>{' '}
                  <strong>{c.nom}</strong> — {c.categorie} —{' '}
                  <span className="font-medium">{STATUT_PARAM_LABEL[c.statut]}</span>
                  {c.requis && c.statut === 'INACTIF' && (
                    <span className="ml-1 text-destructive font-semibold">(requis!)</span>
                  )}
                </li>
              ))}
              {alertParams.length > 5 && (
                <li className="text-xs text-warning/60">
                  + {alertParams.length - 5} autre{alertParams.length - 5 > 1 ? 's' : ''}…
                </li>
              )}
            </ul>
          </div>
        </div>
      )}

      {/* ── KPIs ─────────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title="Total paramètres"
          value={kpis.total}
          icon={<Settings className="h-4 w-4 text-primary" aria-hidden="true" />}
          iconVariant="primary"
          description="Dans la configuration"
        />
        <StatCard
          title="Actifs"
          value={kpis.actifs}
          icon={<CheckCircle2 className="h-4 w-4 text-success" aria-hidden="true" />}
          iconVariant="success"
          description="En service"
        />
        <StatCard
          title="Modifiés récemment"
          value={kpis.recents}
          icon={<Clock className="h-4 w-4 text-info" aria-hidden="true" />}
          iconVariant="info"
          description="30 derniers jours"
        />
        <StatCard
          title="Alertes config"
          value={kpis.alertes}
          icon={<AlertTriangle className="h-4 w-4 text-warning" aria-hidden="true" />}
          iconVariant="warning"
          description="À résoudre"
        />
        <StatCard
          title="Catégories actives"
          value={kpis.categories}
          icon={<LayoutGrid className="h-4 w-4 text-secondary-foreground" aria-hidden="true" />}
          iconVariant="default"
          description="Sur 7 au total"
        />
      </div>

      {/* ── Graphiques ───────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Par catégorie */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Par catégorie</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={categorieData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 8 }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: 6, fontSize: 11 }}
                  formatter={(v) => [`${v}`, 'Paramètres']}
                  cursor={{ fill: 'hsl(var(--muted))', opacity: 0.5 }}
                />
                <Bar dataKey="Paramètres" fill="hsl(var(--primary))" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Répartition statuts */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Répartition par statut</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-center">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: 6, fontSize: 11 }}
                  formatter={(v) => [`${v}`, 'Paramètres']}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Historique modifications */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Historique des modifications</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={evolutionData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="label" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: 6, fontSize: 11 }}
                  formatter={(v) => [`${v}`, 'Modifications']}
                />
                <Legend wrapperStyle={{ fontSize: 11, color: 'hsl(var(--muted-foreground))' }} />
                <Line
                  type="monotone" dataKey="Modifications" stroke="hsl(var(--primary))" strokeWidth={2}
                  dot={{ fill: 'hsl(var(--primary))', r: 3 }} activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* ── DataTable ─────────────────────────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-base">Registre des paramètres</CardTitle>
          <span className="text-xs text-muted-foreground font-mono">{configs.length} entrées</span>
        </CardHeader>
        <CardContent className="p-0">
          <DataTable
            columns={columns}
            data={configs}
            searchKey="nom"
            searchPlaceholder="Rechercher par nom, catégorie, valeur…"
            filters={tableFilters}
          />
        </CardContent>
      </Card>

      {/* ── Modal paramètre ───────────────────────────────────────────────────── */}
      <SettingSlideOver
        open={slideOpen}
        onOpenChange={(open) => { setSlideOpen(open); if (!open) setActionError(null); }}
        mode={slideMode}
        setting={slideCfg}
        canManage={canManage}
        canDelete={canDelete}
        isSaving={createMutation.isPending || updateMutation.isPending}
        error={actionError}
        onSave={handleSave}
        onDelete={(id) => {
          const target = configs.find(c => c.id === id);
          if (target) { setSlideOpen(false); setActionError(null); setDeleteTarget(target); }
        }}
        onDuplicate={handleDuplicate}
      />

      {/* ── Modal suppression ──────────────────────────────────────────────────── */}
      <Modal open={!!deleteTarget} onOpenChange={(open) => { if (!open) { setDeleteTarget(null); setActionError(null); } }}>
        <ModalContent>
          <ModalHeader>
            <ModalTitle>Supprimer le paramètre</ModalTitle>
            <ModalDescription>
              Êtes-vous sûr de vouloir supprimer le paramètre{' '}
              <strong>{deleteTarget?.nom}</strong>{' '}
              ({deleteTarget?.code_param}) ?{' '}
              Cette action est irréversible.
            </ModalDescription>
          </ModalHeader>
          {actionError && (
            <p className="px-6 pb-2 text-sm text-destructive flex items-center gap-1.5" role="alert">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              {actionError}
            </p>
          )}
          <ModalFooter>
            <ModalClose asChild>
              <Button variant="outline">Annuler</Button>
            </ModalClose>
            <Button variant="destructive" onClick={handleDeleteConfirm} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending ? 'Suppression...' : 'Supprimer'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

    </section>
  );
}
