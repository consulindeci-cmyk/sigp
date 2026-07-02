import { useState, useMemo, useCallback } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import * as XLSX from 'xlsx';
import {
  AlertTriangle, Download, FileSpreadsheet, Plus, Eye, Pencil, Trash2,
  Shield, ShieldAlert, CheckCircle2, Info,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  AreaChart, Area, Legend, CartesianGrid,
} from 'recharts';

import type { Risque, NiveauRisque } from '@/types';
import { MOCK_RISQUES, MOCK_RISK_EVOLUTION, RISK_CATEGORIES, STATUT_RISQUE_OPTIONS } from '@/mocks/risksMocks';
import { StatCard } from '@/components/ui/data-display/StatCard';
import { Badge } from '@/components/ui/data-display/Badge';
import { DataTable } from '@/components/ui/data-table/DataTable';
import { Button } from '@/components/ui/forms/Button';
import {
  Modal, ModalContent, ModalHeader, ModalTitle,
  ModalDescription, ModalFooter, ModalClose,
} from '@/components/ui/overlays/Modal';
import { RiskMatrixCard } from './risks/RiskMatrixCard';
import { RiskSlideOver } from './risks/RiskSlideOver';
import type { RiskSlideOverSavePayload } from './risks/RiskSlideOver';

// ─── Constants ───────────────────────────────────────────────────────────────

const NIVEAU_LABEL: Record<NiveauRisque, string> = {
  CRITIQUE: 'Critique',
  ELEVE:    'Élevé',
  MODERE:   'Modéré',
  FAIBLE:   'Faible',
};

const NIVEAU_FILTER_OPTIONS = [
  { label: 'Critique', value: 'CRITIQUE' },
  { label: 'Élevé',   value: 'ELEVE'    },
  { label: 'Modéré',  value: 'MODERE'   },
  { label: 'Faible',  value: 'FAIBLE'   },
];

const CATEGORIE_FILTER_OPTIONS = RISK_CATEGORIES.map(c => ({ label: c, value: c }));
const STATUT_FILTER_OPTIONS    = STATUT_RISQUE_OPTIONS.map(o => ({ label: o.label, value: o.value }));

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getNiveauCriticite(criticite: number): NiveauRisque {
  if (criticite >= 9) return 'CRITIQUE';
  if (criticite >= 6) return 'ELEVE';
  if (criticite >= 3) return 'MODERE';
  return 'FAIBLE';
}

function niveauVariant(n: NiveauRisque): 'destructive' | 'warning' | 'outline' | 'success' {
  if (n === 'CRITIQUE') return 'destructive';
  if (n === 'ELEVE')    return 'warning';
  if (n === 'MODERE')   return 'outline';
  return 'success';
}

function statutVariant(s: string): 'outline' | 'info' | 'success' | 'secondary' {
  if (s === 'EN_COURS') return 'info';
  if (s === 'MAÎTRISÉ') return 'success';
  if (s === 'CLOS')     return 'secondary';
  return 'outline';
}

function fmtStatut(s: string) {
  return STATUT_RISQUE_OPTIONS.find(o => o.value === s)?.label ?? s;
}

function nextCode(risques: Risque[]): string {
  const max = risques.reduce((m, r) => {
    const n = parseInt(r.code_risque.replace('RSQ-', ''), 10);
    return isNaN(n) ? m : Math.max(m, n);
  }, 0);
  return `RSQ-${String(max + 1).padStart(3, '0')}`;
}

function doExportCsv(risques: Risque[]) {
  const headers = ['Code', 'Description', 'Catégorie', 'P', 'I', 'Criticité', 'Niveau', 'Responsable', 'Statut', 'Date identification', 'Date révision', 'Plan de mitigation'];
  const rows = risques.map(r => [
    r.code_risque, r.description, r.categorie,
    r.probabilite, r.impact, r.criticite, r.niveau_criticite,
    r.responsable, fmtStatut(r.statut),
    r.date_identification, r.date_revision_prevue ?? '',
    r.plan_mitigation ?? '',
  ]);
  const csv = '﻿' + [headers, ...rows]
    .map(row => row.map(c => `"${String(c).replace(/"/g, '""')}"`).join(';'))
    .join('\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = `risques-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function doExportXlsx(risques: Risque[]) {
  const headers = ['Code', 'Description', 'Catégorie', 'P', 'I', 'Criticité', 'Niveau', 'Responsable', 'Statut', 'Date ID', 'Date révision', 'Plan de mitigation'];
  const rows = risques.map(r => [
    r.code_risque, r.description, r.categorie,
    r.probabilite, r.impact, r.criticite, r.niveau_criticite,
    r.responsable, fmtStatut(r.statut),
    r.date_identification, r.date_revision_prevue ?? '',
    r.plan_mitigation ?? '',
  ]);
  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  ws['!cols'] = [
    { wch: 10 }, { wch: 45 }, { wch: 18 }, { wch: 4 }, { wch: 4 },
    { wch: 10 }, { wch: 12 }, { wch: 22 }, { wch: 14 }, { wch: 16 }, { wch: 16 }, { wch: 50 },
  ];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Registre des Risques');
  XLSX.writeFile(wb, `risques-${new Date().toISOString().slice(0, 10)}.xlsx`);
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function TabRisks() {
  const [risques, setRisques] = useState<Risque[]>(MOCK_RISQUES);

  const [slideOpen, setSlideOpen]   = useState(false);
  const [slideMode, setSlideMode]   = useState<'new' | 'edit' | 'view'>('new');
  const [selected, setSelected]     = useState<Risque | null>(null);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [toDelete, setToDelete]     = useState<Risque | null>(null);

  // ── KPIs ────────────────────────────────────────────────────────────────

  const kpis = useMemo(() => ({
    total:    risques.length,
    critique: risques.filter(r => r.niveau_criticite === 'CRITIQUE').length,
    eleve:    risques.filter(r => r.niveau_criticite === 'ELEVE').length,
    modere:   risques.filter(r => r.niveau_criticite === 'MODERE').length,
    faible:   risques.filter(r => r.niveau_criticite === 'FAIBLE').length,
  }), [risques]);

  const alertRisques = useMemo(() =>
    risques
      .filter(r =>
        (r.niveau_criticite === 'CRITIQUE' || r.niveau_criticite === 'ELEVE') &&
        r.statut !== 'MAÎTRISÉ' && r.statut !== 'CLOS',
      )
      .sort((a, b) => b.criticite - a.criticite),
    [risques],
  );

  const categoryData = useMemo(() => {
    const counts: Partial<Record<string, number>> = {};
    for (const r of risques) counts[r.categorie] = (counts[r.categorie] ?? 0) + 1;
    return Object.entries(counts)
      .map(([name, count]) => ({ name: name.slice(0, 9), count: count ?? 0 }))
      .sort((a, b) => b.count - a.count);
  }, [risques]);

  const responsableOptions = useMemo(() =>
    [...new Set(risques.map(r => r.responsable))]
      .filter(Boolean).sort().map(v => ({ label: v, value: v })),
    [risques],
  );

  // ── Handlers ────────────────────────────────────────────────────────────

  const handleOpenNew = useCallback(() => {
    setSelected(null); setSlideMode('new'); setSlideOpen(true);
  }, []);

  const handleView = useCallback((r: Risque) => {
    setSelected(r); setSlideMode('view'); setSlideOpen(true);
  }, []);

  const handleEdit = useCallback((r: Risque) => {
    setSelected(r); setSlideMode('edit'); setSlideOpen(true);
  }, []);

  const openDeleteModal = useCallback((r: Risque) => {
    setToDelete(r); setDeleteOpen(true);
  }, []);

  const handleSave = useCallback((payload: RiskSlideOverSavePayload, id?: string) => {
    const criticite = payload.probabilite * payload.impact;
    const niveau    = getNiveauCriticite(criticite);
    if (id) {
      setRisques(prev => prev.map(r => r.id !== id ? r : {
        ...r, ...payload, criticite, niveau_criticite: niveau,
        updatedAt: new Date().toISOString(),
      }));
    } else {
      const now = new Date().toISOString();
      const newR: Risque = {
        id:               `r-${Date.now()}`,
        projet_id:        'mock-proj-01',
        code_risque:      nextCode(risques),
        description:      payload.description,
        categorie:        payload.categorie,
        probabilite:      payload.probabilite,
        impact:           payload.impact,
        criticite,
        niveau_criticite: niveau,
        statut:           payload.statut,
        responsable:      payload.responsable,
        plan_mitigation:  payload.plan_mitigation,
        date_identification:  payload.date_identification,
        date_revision_prevue: payload.date_revision_prevue,
        createdAt: now, updatedAt: now,
      };
      setRisques(prev => [...prev, newR]);
    }
  }, [risques]);

  const handleDeleteFromSlideOver = useCallback((id: string) => {
    setRisques(prev => prev.filter(r => r.id !== id));
  }, []);

  const confirmDelete = useCallback(() => {
    if (toDelete) setRisques(prev => prev.filter(r => r.id !== toDelete.id));
    setDeleteOpen(false);
    setToDelete(null);
  }, [toDelete]);

  // ── Columns ─────────────────────────────────────────────────────────────

  const columns = useMemo((): ColumnDef<Risque, unknown>[] => [
    {
      accessorKey: 'code_risque',
      header: 'Code',
      size: 100,
      meta: { isSticky: true } as Record<string, unknown>,
    },
    {
      accessorKey: 'description',
      header: 'Risque',
      size: 280,
      cell: ({ row }) => (
        <span className="block max-w-[260px] truncate" title={row.original.description}>
          {row.original.description}
        </span>
      ),
    },
    {
      accessorKey: 'categorie',
      header: 'Catégorie',
      size: 140,
    },
    {
      accessorKey: 'probabilite',
      header: 'P',
      size: 50,
      meta: { align: 'center' } as Record<string, unknown>,
    },
    {
      accessorKey: 'impact',
      header: 'I',
      size: 50,
      meta: { align: 'center' } as Record<string, unknown>,
    },
    {
      accessorKey: 'niveau_criticite',
      header: 'Criticité',
      size: 160,
      cell: ({ row }) => {
        const { criticite, niveau_criticite } = row.original;
        return (
          <div className="flex items-center gap-2">
            <span className="font-bold font-mono text-sm w-4 text-center shrink-0">{criticite}</span>
            <Badge variant={niveauVariant(niveau_criticite)}>
              {NIVEAU_LABEL[niveau_criticite]}
            </Badge>
          </div>
        );
      },
    },
    {
      accessorKey: 'responsable',
      header: 'Responsable',
      size: 160,
    },
    {
      accessorKey: 'statut',
      header: 'Statut',
      size: 120,
      cell: ({ row }) => (
        <Badge variant={statutVariant(row.original.statut)}>
          {fmtStatut(row.original.statut)}
        </Badge>
      ),
    },
    {
      accessorKey: 'date_identification',
      header: 'Date ID',
      size: 110,
      cell: ({ row }) =>
        new Date(row.original.date_identification).toLocaleDateString('fr-FR'),
    },
    {
      accessorKey: 'date_revision_prevue',
      header: 'Date révision',
      size: 120,
      cell: ({ row }) =>
        row.original.date_revision_prevue
          ? new Date(row.original.date_revision_prevue).toLocaleDateString('fr-FR')
          : <span className="text-muted-foreground">—</span>,
    },
    {
      id: 'actions',
      header: 'Actions',
      size: 110,
      meta: { align: 'center', isStickyRight: true } as Record<string, unknown>,
      cell: ({ row }) => (
        <div className="flex items-center justify-center gap-0.5">
          <Button variant="ghost" size="icon" className="h-7 w-7"
            onClick={() => handleView(row.original)} title="Consulter">
            <Eye className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7"
            onClick={() => handleEdit(row.original)} title="Modifier">
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon"
            className="h-7 w-7 hover:bg-destructive/10 hover:text-destructive"
            onClick={() => openDeleteModal(row.original)} title="Supprimer">
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      ),
    },
  ], [handleView, handleEdit, openDeleteModal]);

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">

      {/* KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatCard title="Total Risques" value={kpis.total}
          icon={<Shield className="h-4 w-4 text-primary" />} iconVariant="primary" />
        <StatCard title="Critiques" value={kpis.critique}
          icon={<ShieldAlert className="h-4 w-4 text-destructive" />} iconVariant="destructive" />
        <StatCard title="Élevés" value={kpis.eleve}
          icon={<AlertTriangle className="h-4 w-4 text-warning" />} iconVariant="warning" />
        <StatCard title="Modérés" value={kpis.modere}
          icon={<Info className="h-4 w-4 text-info" />} iconVariant="info" />
        <StatCard title="Faibles" value={kpis.faible}
          icon={<CheckCircle2 className="h-4 w-4 text-success" />} iconVariant="success" />
      </div>

      {/* Alertes automatiques */}
      {alertRisques.length > 0 && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4">
          <div className="flex items-center gap-2 mb-3">
            <ShieldAlert className="h-4 w-4 text-destructive shrink-0" />
            <h3 className="text-sm font-semibold text-destructive">
              {alertRisques.length} risque{alertRisques.length > 1 ? 's' : ''} à traiter en priorité
            </h3>
          </div>
          <div className="space-y-2">
            {alertRisques.slice(0, 5).map(r => (
              <div key={r.id} className="flex items-start gap-2 text-xs">
                <Badge variant={niveauVariant(r.niveau_criticite)} className="shrink-0">
                  {NIVEAU_LABEL[r.niveau_criticite]}
                </Badge>
                <span className="text-foreground">
                  <strong>{r.code_risque}</strong> — {r.description}
                  <span className="ml-2 text-muted-foreground">({r.responsable})</span>
                </span>
              </div>
            ))}
            {alertRisques.length > 5 && (
              <p className="text-xs text-muted-foreground italic">
                + {alertRisques.length - 5} autre{alertRisques.length - 5 > 1 ? 's' : ''} risque{alertRisques.length - 5 > 1 ? 's' : ''}…
              </p>
            )}
          </div>
        </div>
      )}

      {/* Matrice + Graphiques */}
      <div className="grid grid-cols-1 xl:grid-cols-[auto_1fr] gap-6 items-start">
        <RiskMatrixCard risks={risques} />

        <div className="space-y-4">
          {/* Répartition par catégorie */}
          <div className="bg-card border border-border rounded-lg p-5">
            <h3 className="text-sm font-semibold text-foreground mb-4">Répartition par catégorie</h3>
            <ResponsiveContainer width="100%" height={190}>
              <BarChart data={categoryData} barSize={26}
                margin={{ left: -10, right: 10, top: 4, bottom: 36 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="name"
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                  axisLine={false} tickLine={false} interval={0}
                  angle={-35} textAnchor="end" height={50} />
                <YAxis allowDecimals={false}
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                  axisLine={false} tickLine={false} />
                <Tooltip
                  cursor={{ fill: 'hsl(var(--muted))', radius: 4 }}
                  contentStyle={{
                    background: 'hsl(var(--popover))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px', fontSize: '12px',
                  }}
                  formatter={(v) => [`${v} risque${(v as number) > 1 ? 's' : ''}`, 'Nombre']}
                />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Évolution du portefeuille */}
          <div className="bg-card border border-border rounded-lg p-5">
            <h3 className="text-sm font-semibold text-foreground mb-4">Évolution du portefeuille de risques</h3>
            <ResponsiveContainer width="100%" height={190}>
              <AreaChart data={MOCK_RISK_EVOLUTION} margin={{ left: -10, right: 10, top: 4, bottom: 0 }}>
                <defs>
                  <linearGradient id="gcrit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="hsl(var(--destructive))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--destructive))" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gelev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="hsl(var(--warning))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--warning))" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gmod" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="hsl(var(--primary))" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gfai" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="hsl(var(--success))" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="hsl(var(--success))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="mois"
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                  axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false}
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                  axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    background: 'hsl(var(--popover))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px', fontSize: '12px',
                  }}
                />
                <Legend iconType="circle" iconSize={8}
                  wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Area type="monotone" dataKey="critique" name="Critique" stackId="1"
                  stroke="hsl(var(--destructive))" fill="url(#gcrit)" strokeWidth={1.5} />
                <Area type="monotone" dataKey="eleve" name="Élevé" stackId="1"
                  stroke="hsl(var(--warning))" fill="url(#gelev)" strokeWidth={1.5} />
                <Area type="monotone" dataKey="modere" name="Modéré" stackId="1"
                  stroke="hsl(var(--primary))" fill="url(#gmod)" strokeWidth={1.5} />
                <Area type="monotone" dataKey="faible" name="Faible" stackId="1"
                  stroke="hsl(var(--success))" fill="url(#gfai)" strokeWidth={1.5} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Registre des risques */}
      <div className="space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h2 className="text-base font-semibold text-foreground">
            Registre des risques
            <span className="ml-2 text-sm font-normal text-muted-foreground">
              ({risques.length} risque{risques.length !== 1 ? 's' : ''})
            </span>
          </h2>
          <div className="flex items-center gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={() => doExportCsv(risques)}>
              <Download className="h-3.5 w-3.5 mr-1.5" />CSV
            </Button>
            <Button variant="outline" size="sm" onClick={() => doExportXlsx(risques)}>
              <FileSpreadsheet className="h-3.5 w-3.5 mr-1.5" />Excel
            </Button>
            <Button size="sm" onClick={handleOpenNew}>
              <Plus className="h-3.5 w-3.5 mr-1.5" />Nouveau risque
            </Button>
          </div>
        </div>

        <DataTable
          columns={columns}
          data={risques}
          isLoading={false}
          searchKey="description"
          searchPlaceholder="Rechercher un risque…"
          filters={[
            { id: 'niveau_criticite', title: 'Niveau',      options: NIVEAU_FILTER_OPTIONS    },
            { id: 'categorie',        title: 'Catégorie',   options: CATEGORIE_FILTER_OPTIONS  },
            { id: 'statut',           title: 'Statut',      options: STATUT_FILTER_OPTIONS     },
            { id: 'responsable',      title: 'Responsable', options: responsableOptions        },
          ]}
        />
      </div>

      {/* SlideOver CRUD */}
      <RiskSlideOver
        open={slideOpen}
        onOpenChange={setSlideOpen}
        mode={slideMode}
        risque={selected}
        onSave={handleSave}
        onDelete={handleDeleteFromSlideOver}
      />

      {/* Modal suppression (depuis le tableau) */}
      <Modal open={deleteOpen} onOpenChange={setDeleteOpen}>
        <ModalContent>
          <ModalHeader>
            <ModalTitle>Supprimer le risque</ModalTitle>
            <ModalDescription>
              Cette action est irréversible. Confirmer la suppression de{' '}
              <strong>{toDelete?.code_risque}</strong> ?
            </ModalDescription>
          </ModalHeader>
          <ModalFooter>
            <ModalClose asChild>
              <Button variant="outline">Annuler</Button>
            </ModalClose>
            <Button variant="destructive" onClick={confirmDelete}>Supprimer</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

    </div>
  );
}
