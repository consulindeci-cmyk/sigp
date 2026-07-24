import { useState, useMemo, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useRisks, useCreateRisk, useUpdateRisk, useDeleteRisk } from '@/hooks/useRisks';
import { useUIStore } from '@/stores/uiStore';
import { useAuthStore } from '@/stores/authStore';
import type { ColumnDef } from '@tanstack/react-table';
import * as XLSX from 'xlsx';
import {
  AlertTriangle, AlertCircle, Download, FileSpreadsheet, Plus, Eye, Pencil, Trash2,
  Shield, ShieldAlert, CheckCircle2,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';

import type { Risque, NiveauRisque } from '@/types';
import { RISK_CATEGORIES, STATUT_RISQUE_OPTIONS } from '@/mocks/risksMocks';
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
  ELEVE:  'Élevé',
  MOYEN:  'Moyen',
  FAIBLE: 'Faible',
};

const NIVEAU_FILTER_OPTIONS = [
  { label: 'Élevé',  value: 'ELEVE'  },
  { label: 'Moyen',  value: 'MOYEN'  },
  { label: 'Faible', value: 'FAIBLE' },
];

const CATEGORIE_FILTER_OPTIONS = RISK_CATEGORIES.map(c => ({ label: c, value: c }));
const STATUT_FILTER_OPTIONS    = STATUT_RISQUE_OPTIONS.map(o => ({ label: o.label, value: o.value }));

// ─── Helpers ─────────────────────────────────────────────────────────────────

// Matrice 3×3 stricte : score 1-4 FAIBLE, 5-6 MOYEN, 7-9 ÉLEVÉ.
function getNiveauCriticite(criticite: number): NiveauRisque {
  if (criticite <= 4) return 'FAIBLE';
  if (criticite <= 6) return 'MOYEN';
  return 'ELEVE';
}

function niveauVariant(n: NiveauRisque): 'destructive' | 'warning' | 'success' {
  if (n === 'ELEVE') return 'destructive';
  if (n === 'MOYEN') return 'warning';
  return 'success';
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
  const headers = ['N°', 'Catégorie', 'Description du Risque', 'P', 'I', 'Criticité', 'Niveau', "Stratégie d'atténuation", 'Responsable', 'Statut', 'Date identification', 'Date révision'];
  const rows = risques.map(r => [
    r.code_risque, r.categorie, r.description,
    r.probabilite, r.impact, r.criticite, r.niveau_criticite,
    r.strategie ?? '', r.responsable, fmtStatut(r.statut),
    r.date_identification, r.date_revision_prevue ?? '',
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
  const headers = ['N°', 'Catégorie', 'Description du Risque', 'P', 'I', 'Criticité', 'Niveau', "Stratégie d'atténuation", 'Responsable', 'Statut', 'Date ID', 'Date révision'];
  const rows = risques.map(r => [
    r.code_risque, r.categorie, r.description,
    r.probabilite, r.impact, r.criticite, r.niveau_criticite,
    r.strategie ?? '', r.responsable, fmtStatut(r.statut),
    r.date_identification, r.date_revision_prevue ?? '',
  ]);
  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  ws['!cols'] = [
    { wch: 10 }, { wch: 18 }, { wch: 45 }, { wch: 4 }, { wch: 4 },
    { wch: 10 }, { wch: 12 }, { wch: 50 }, { wch: 22 }, { wch: 14 }, { wch: 16 }, { wch: 16 },
  ];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Registre des Risques');
  XLSX.writeFile(wb, `risques-${new Date().toISOString().slice(0, 10)}.xlsx`);
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function TabRisks() {
  const { id: urlProjectId }   = useParams<{ id: string }>();
  const activeProjectId        = useUIStore(s => s.activeProjectId);
  const projectId              = urlProjectId || activeProjectId || '';

  const { data: apiRisques, isLoading } = useRisks(projectId);
  const createMutation  = useCreateRisk(projectId);
  const updateMutation  = useUpdateRisk(projectId);
  const deleteMutation  = useDeleteRisk(projectId);

  // Dérivé de la réponse serveur, jamais copié dans un state local — plus
  // de désynchronisation possible entre l'affichage et la réalité serveur
  // (cf. audit : l'ancien useEffect+setState laissait aussi les mises à jour
  // optimistes de handleSave/handleDelete "survivre" en cas d'échec serveur).
  const risques = useMemo(() => apiRisques?.data ?? [], [apiRisques]);

  // Miroir des rôles serveur : requireRole sur risques-create/update
  // (COORDINATEUR/CHARGE_PROGRAMME/ADMIN/SUPER_ADMIN) et -delete (ADMIN/SUPER_ADMIN).
  const currentRole = useAuthStore(s => s.user?.role);
  const canManage = !!currentRole && ['COORDINATEUR', 'CHARGE_PROGRAMME', 'ADMIN', 'SUPER_ADMIN'].includes(currentRole);
  const canDelete = currentRole === 'ADMIN' || currentRole === 'SUPER_ADMIN';

  const [slideOpen, setSlideOpen]   = useState(false);
  const [slideMode, setSlideMode]   = useState<'new' | 'edit' | 'view'>('new');
  const [selected, setSelected]     = useState<Risque | null>(null);
  const [slideError, setSlideError] = useState<string | null>(null);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [toDelete, setToDelete]     = useState<Risque | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  function extractErrorMessage(err: unknown): string {
    return err instanceof Error ? err.message : 'Une erreur est survenue. Veuillez réessayer.';
  }

  // ── KPIs ────────────────────────────────────────────────────────────────

  const kpis = useMemo(() => ({
    total:  risques.length,
    eleve:  risques.filter(r => r.niveau_criticite === 'ELEVE').length,
    moyen:  risques.filter(r => r.niveau_criticite === 'MOYEN').length,
    faible: risques.filter(r => r.niveau_criticite === 'FAIBLE').length,
  }), [risques]);

  const alertRisques = useMemo(() =>
    risques
      .filter(r =>
        r.niveau_criticite === 'ELEVE' &&
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
    setSelected(null); setSlideMode('new'); setSlideError(null); setSlideOpen(true);
  }, []);

  const handleView = useCallback((r: Risque) => {
    setSelected(r); setSlideMode('view'); setSlideOpen(true);
  }, []);

  const handleEdit = useCallback((r: Risque) => {
    setSelected(r); setSlideMode('edit'); setSlideError(null); setSlideOpen(true);
  }, []);

  const openDeleteModal = useCallback((r: Risque) => {
    setToDelete(r); setDeleteError(null); setDeleteOpen(true);
  }, []);

  // Le parent possède la mutation et ne ferme le SlideOver qu'après
  // confirmation serveur (onSuccess) — plus de mise à jour optimiste ni de
  // fermeture avant réponse (cf. audit). L'erreur reste affichée dans le
  // SlideOver si la mutation échoue, l'utilisateur peut corriger et réessayer.
  const handleSave = useCallback((payload: RiskSlideOverSavePayload, id?: string) => {
    setSlideError(null);
    const criticite = payload.probabilite * payload.impact;
    const niveau    = getNiveauCriticite(criticite);
    const onError = (err: unknown) => setSlideError(extractErrorMessage(err));
    if (id) {
      updateMutation.mutate(
        { id, ...payload, criticite, niveau_criticite: niveau },
        { onSuccess: () => setSlideOpen(false), onError },
      );
    } else {
      const dto: Partial<Risque> = {
        projet_id:            projectId,
        code_risque:          nextCode(risques),
        description:          payload.description,
        categorie:            payload.categorie,
        probabilite:          payload.probabilite,
        impact:               payload.impact,
        criticite,
        niveau_criticite:     niveau,
        statut:               payload.statut,
        responsable:          payload.responsable,
        responsableId:        payload.responsableId,
        strategie:            payload.strategie,
        date_identification:  payload.date_identification,
        date_revision_prevue: payload.date_revision_prevue,
      };
      createMutation.mutate(dto, { onSuccess: () => setSlideOpen(false), onError });
    }
  }, [risques, projectId, createMutation, updateMutation]);

  const handleDeleteFromSlideOver = useCallback((id: string) => {
    setSlideError(null);
    deleteMutation.mutate(id, {
      onSuccess: () => setSlideOpen(false),
      onError: (err) => setSlideError(extractErrorMessage(err)),
    });
  }, [deleteMutation]);

  const confirmDelete = useCallback(() => {
    if (!toDelete) return;
    setDeleteError(null);
    deleteMutation.mutate(toDelete.id, {
      onSuccess: () => { setDeleteOpen(false); setToDelete(null); },
      onError: (err) => setDeleteError(extractErrorMessage(err)),
    });
  }, [toDelete, deleteMutation]);

  // ── Columns ─────────────────────────────────────────────────────────────

  const columns = useMemo((): ColumnDef<Risque, unknown>[] => [
    {
      accessorKey: 'code_risque',
      header: 'N°',
      size: 100,
      meta: { isSticky: true } as Record<string, unknown>,
    },
    {
      accessorKey: 'categorie',
      header: 'Catégorie',
      size: 140,
    },
    {
      accessorKey: 'description',
      header: 'Description du Risque',
      size: 280,
      cell: ({ row }) => (
        <span className="block max-w-[260px] truncate" title={row.original.description}>
          {row.original.description}
        </span>
      ),
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
      accessorKey: 'strategie',
      header: "Stratégie d'atténuation",
      size: 260,
      cell: ({ row }) => {
        const s = row.original.strategie;
        return s
          ? <span className="block max-w-[240px] truncate" title={s}>{s}</span>
          : <span className="text-muted-foreground">—</span>;
      },
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
          {canManage && (
            <Button variant="ghost" size="icon" className="h-7 w-7"
              onClick={() => handleEdit(row.original)} title="Modifier">
              <Pencil className="h-3.5 w-3.5" />
            </Button>
          )}
          {canDelete && (
            <Button variant="ghost" size="icon"
              className="h-7 w-7 hover:bg-destructive/10 hover:text-destructive"
              onClick={() => openDeleteModal(row.original)} title="Supprimer">
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      ),
    },
  ], [handleView, handleEdit, openDeleteModal, canManage, canDelete]);

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">

      {/* KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard title="Total Risques" value={kpis.total}
          icon={<Shield className="h-4 w-4 text-primary" />} iconVariant="primary" />
        <StatCard title="Élevés" value={kpis.eleve}
          icon={<ShieldAlert className="h-4 w-4 text-destructive" />} iconVariant="destructive" />
        <StatCard title="Moyens" value={kpis.moyen}
          icon={<AlertTriangle className="h-4 w-4 text-warning" />} iconVariant="warning" />
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

          {/* Répartition par niveau de criticité — remplace un graphique
              d'évolution historique qui était figé sur un tableau vide
              codé en dur (aucun historique de risques n'est stocké côté
              serveur, cf. audit) ; ces compteurs, eux, reflètent l'état réel
              et actuel du registre. */}
          <div className="bg-card border border-border rounded-lg p-5">
            <h3 className="text-sm font-semibold text-foreground mb-4">Répartition par niveau de criticité</h3>
            <div className="grid grid-cols-3 gap-3">
              <div className="flex items-center justify-between rounded-lg border border-border bg-muted/20 px-3 py-2.5">
                <span className="flex items-center gap-2 text-xs font-medium text-foreground">
                  <span className="h-2 w-2 rounded-full bg-destructive" aria-hidden="true" />
                  Élevés
                </span>
                <span className="font-mono text-sm font-bold text-foreground">{kpis.eleve}</span>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border bg-muted/20 px-3 py-2.5">
                <span className="flex items-center gap-2 text-xs font-medium text-foreground">
                  <span className="h-2 w-2 rounded-full bg-warning" aria-hidden="true" />
                  Moyens
                </span>
                <span className="font-mono text-sm font-bold text-foreground">{kpis.moyen}</span>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border bg-muted/20 px-3 py-2.5">
                <span className="flex items-center gap-2 text-xs font-medium text-foreground">
                  <span className="h-2 w-2 rounded-full bg-success" aria-hidden="true" />
                  Faibles
                </span>
                <span className="font-mono text-sm font-bold text-foreground">{kpis.faible}</span>
              </div>
            </div>
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
            {canManage && (
              <Button size="sm" onClick={handleOpenNew}>
                <Plus className="h-3.5 w-3.5 mr-1.5" />Nouveau risque
              </Button>
            )}
          </div>
        </div>

        <DataTable
          columns={columns}
          data={risques}
          isLoading={isLoading}
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
        onOpenChange={open => { setSlideOpen(open); if (!open) setSlideError(null); }}
        mode={slideMode}
        projectId={projectId}
        risque={selected}
        onSave={handleSave}
        onDelete={handleDeleteFromSlideOver}
        canDelete={canDelete}
        isSaving={createMutation.isPending || updateMutation.isPending}
        isDeleting={deleteMutation.isPending}
        error={slideError}
      />

      {/* Modal suppression (depuis le tableau) */}
      <Modal open={deleteOpen} onOpenChange={open => { setDeleteOpen(open); if (!open) { setToDelete(null); setDeleteError(null); } }}>
        <ModalContent>
          <ModalHeader>
            <ModalTitle>Supprimer le risque</ModalTitle>
            <ModalDescription>
              Cette action est irréversible. Confirmer la suppression de{' '}
              <strong>{toDelete?.code_risque}</strong> ?
            </ModalDescription>
          </ModalHeader>
          {deleteError && (
            <p className="px-6 pb-2 text-sm text-destructive flex items-center gap-1.5" role="alert">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              {deleteError}
            </p>
          )}
          <ModalFooter>
            <ModalClose asChild>
              <Button variant="outline">Annuler</Button>
            </ModalClose>
            <Button variant="destructive" onClick={confirmDelete} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending ? 'Suppression...' : 'Supprimer'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

    </div>
  );
}
