import { useCallback, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import * as XLSX from 'xlsx';
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import type { ColumnDef } from '@tanstack/react-table';
import {
  MessageSquare, CheckCircle2, Clock, Paperclip, CalendarDays,
  AlertCircle, Download, FileSpreadsheet, Plus, Eye, Pencil, Trash2,
} from 'lucide-react';
import type { CommentaireProjet, StatutCommentaire, PrioriteCommentaire, ModuleCommentaire } from '@/types';
import {
  MODULES_COMMENTAIRE, STATUT_COMMENTAIRE_LABEL,
  PRIORITE_COMMENTAIRE_LABEL, STATUT_OPTIONS, PRIORITE_OPTIONS, MODULE_OPTIONS,
} from '@/mocks/commentsMocks';
import { useUIStore } from '@/stores/uiStore';
import { useAuthStore } from '@/stores/authStore';
import { useComments, useCreateComment, useUpdateComment, useDeleteComment } from '@/hooks/useComments';
import { useUploadCommentAttachment, useDownloadDocumentVersion } from '@/hooks/useDocuments';
import { CommentSlideOver } from './comments/CommentSlideOver';
import type { CommentSavePayload } from './comments/CommentSlideOver';
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

function statutVariant(s: StatutCommentaire): 'default' | 'success' | 'warning' | 'secondary' | 'destructive' | 'info' {
  if (s === 'OUVERT')     return 'warning';
  if (s === 'EN_COURS')   return 'info';
  if (s === 'RESOLU')     return 'success';
  if (s === 'FERME')      return 'secondary';
  return 'default';
}

function prioriteVariant(p: PrioriteCommentaire): 'default' | 'success' | 'warning' | 'destructive' | 'secondary' {
  if (p === 'URGENTE') return 'destructive';
  if (p === 'HAUTE')   return 'warning';
  if (p === 'NORMALE') return 'default';
  return 'secondary';
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function TabComments() {
  const { id: urlProjectId } = useParams<{ id: string }>();
  const activeProjectId = useUIStore(s => s.activeProjectId);
  const projectId = urlProjectId || activeProjectId || '';

  const { data: commentaires = [] } = useComments(projectId);
  const createMutation   = useCreateComment(projectId);
  const updateMutation   = useUpdateComment(projectId);
  const deleteMutation   = useDeleteComment(projectId);
  const uploadMutation   = useUploadCommentAttachment(projectId);
  const downloadMutation = useDownloadDocumentVersion();

  // Modération par propriété (ownership), pas par rôle de gestion : miroir
  // exact de la RLS/Edge Functions comments-update/comments-delete
  // (auteur OU ADMIN/SUPER_ADMIN). Tout commentaire visible ici est déjà
  // garanti de la même organisation par la policy SELECT — un ADMIN qui le
  // voit est donc forcément dans son périmètre.
  const currentUser = useAuthStore(s => s.user);
  const currentRole = currentUser?.role;
  const canManageComment = useCallback((c: CommentaireProjet) =>
    currentRole === 'SUPER_ADMIN' || currentRole === 'ADMIN' || c.auteurId === currentUser?.id,
  [currentRole, currentUser?.id]);
  // Miroir de requireRole(documents-create) : seuls ces rôles peuvent
  // réellement téléverser un fichier (attacher une pièce jointe suppose de
  // créer un vrai documents_projet + un vrai upload Storage).
  const canAttachFile = !!currentRole && ['COORDINATEUR', 'CHARGE_PROGRAMME', 'ADMIN', 'SUPER_ADMIN'].includes(currentRole);

  const [slideOpen,   setSlideOpen]     = useState(false);
  const [slideMode,   setSlideMode]     = useState<'new' | 'edit' | 'view'>('new');
  const [slideCmt,    setSlideCmt]      = useState<CommentaireProjet | null>(null);
  const [defaultPid,  setDefaultPid]    = useState<string>('');
  const [deleteTarget, setDeleteTarget] = useState<CommentaireProjet | null>(null);
  const [actionError, setActionError]   = useState<string | null>(null);

  // ── KPIs ────────────────────────────────────────────────────────────────────

  const kpis = useMemo(() => {
    const today   = new Date().toISOString().slice(0, 10);
    const ouverts = commentaires.filter(c =>
      c.statut === 'OUVERT' || c.statut === 'EN_COURS',
    ).length;
    const resolus = commentaires.filter(c =>
      c.statut === 'RESOLU' || c.statut === 'FERME',
    ).length;
    const ajd     = commentaires.filter(c => c.date_creation === today).length;
    const avec_pj = commentaires.filter(c => !!c.pieceJointeDocumentId).length;
    return { total: commentaires.length, ouverts, resolus, ajd, avec_pj };
  }, [commentaires]);

  // ── Alerte commentaires ouverts ──────────────────────────────────────────────

  const ouvertsParents = useMemo(
    () => commentaires.filter(c => c.statut === 'OUVERT' && !c.parent_id),
    [commentaires],
  );

  // ── Données graphiques ───────────────────────────────────────────────────────

  const moduleData = useMemo(() =>
    MODULES_COMMENTAIRE
      .map(m => ({ name: m, Commentaires: commentaires.filter(c => c.module === m).length }))
      .filter(d => d.Commentaires > 0)
      .sort((a, b) => b.Commentaires - a.Commentaires),
  [commentaires]);

  const statutData = useMemo(() =>
    STATUT_OPTIONS.map(o => ({
      name: o.label,
      Commentaires: commentaires.filter(c => c.statut === o.value).length,
    })).filter(d => d.Commentaires > 0),
  [commentaires]);

  const evolutionData = useMemo(() => {
    const months: { label: string; Commentaires: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const dt = new Date();
      dt.setDate(1);
      dt.setMonth(dt.getMonth() - i);
      const mois  = dt.toISOString().slice(0, 7);
      const label = dt.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' });
      months.push({
        label,
        Commentaires: commentaires.filter(c => c.date_creation.startsWith(mois)).length,
      });
    }
    return months;
  }, [commentaires]);

  // ── Filtres ──────────────────────────────────────────────────────────────────

  const auteurOptions = useMemo(() => {
    const unique = [...new Set(commentaires.map(c => c.auteur))].sort();
    return unique.map(a => ({ label: a, value: a }));
  }, [commentaires]);

  const tableFilters = useMemo(() => [
    {
      id: 'module',
      title: 'Module',
      options: MODULE_OPTIONS,
    },
    {
      id: 'auteur',
      title: 'Auteur',
      options: auteurOptions,
    },
    {
      id: 'statut',
      title: 'Statut',
      options: STATUT_OPTIONS.map(o => ({ label: o.label, value: o.value as string })),
    },
    {
      id: 'priorite',
      title: 'Priorité',
      options: PRIORITE_OPTIONS.map(o => ({ label: o.label, value: o.value as string })),
    },
    {
      id: 'piece_jointe',
      title: 'Pièce jointe',
      options: [
        { label: 'Avec pièce jointe', value: 'Oui' },
        { label: 'Sans pièce jointe', value: 'Non' },
      ],
    },
  ], [auteurOptions]);

  // ── Handlers ─────────────────────────────────────────────────────────────────
  // Le parent possède les mutations et ne ferme le SlideOver qu'après
  // confirmation serveur (onSuccess) — plus de fermeture aveugle (cf. audit :
  // un non-auteur cliquant Modifier/Supprimer sur le commentaire d'un autre
  // échouait en silence, RLS/Edge Function refusant sans aucun signal).
  //
  // Séquencement fiche → pièce jointe : si un fichier a été sélectionné, il
  // est réellement téléversé (documents-create + documents-upload-version)
  // AVANT la création/mise à jour du commentaire, pour inclure le vrai
  // document_id obtenu dans le même appel — pas d'état "commentaire créé mais
  // pièce jointe orpheline" possible côté commentaire (l'inverse du risque
  // documenté sur Documents, où c'est la fiche qui précède le fichier).
  const handleSave = useCallback(async (payload: CommentSavePayload, id: string | undefined, file: File | null) => {
    setActionError(null);
    try {
      let pieceJointeDocumentId: string | null | undefined = payload.removeAttachment ? null : undefined;
      if (file) {
        const created = await uploadMutation.mutateAsync(file);
        pieceJointeDocumentId = created.id;
      }

      if (id) {
        await updateMutation.mutateAsync({
          id,
          message: payload.message,
          statut: payload.statut,
          priorite: payload.priorite,
          pieceJointeDocumentId,
          mentionUserId: payload.mention_user_id,
        });
      } else {
        await createMutation.mutateAsync({
          module: payload.module,
          elementId: payload.element_id,
          elementNom: payload.element_nom,
          message: payload.message,
          statut: payload.statut,
          priorite: payload.priorite,
          parentId: payload.parent_id,
          pieceJointeDocumentId,
          mentionUserId: payload.mention_user_id,
        });
      }
      setSlideOpen(false);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Échec de l\'enregistrement du commentaire.');
    }
  }, [createMutation, updateMutation, uploadMutation]);

  const handleDeleteConfirm = useCallback(() => {
    if (!deleteTarget) return;
    setActionError(null);
    deleteMutation.mutate(deleteTarget.id, {
      onSuccess: () => setDeleteTarget(null),
      onError: (err) => setActionError(err instanceof Error ? err.message : 'Échec de la suppression du commentaire.'),
    });
  }, [deleteTarget, deleteMutation]);

  const handleDownload = useCallback((c: CommentaireProjet) => {
    if (!c.pieceJointeDocumentId) return;
    setActionError(null);
    downloadMutation.mutate(c.pieceJointeDocumentId, {
      onSuccess: (data) => window.open(data.url, '_blank', 'noopener,noreferrer'),
      onError: (err) => setActionError(err instanceof Error ? err.message : 'Échec du téléchargement.'),
    });
  }, [downloadMutation]);

  const openNew  = useCallback(() => {
    setSlideCmt(null); setDefaultPid(''); setSlideMode('new'); setSlideOpen(true);
  }, []);
  const openView = useCallback((c: CommentaireProjet) => {
    setSlideCmt(c); setDefaultPid(''); setSlideMode('view'); setSlideOpen(true);
  }, []);
  const openEdit = useCallback((c: CommentaireProjet) => {
    setSlideCmt(c); setDefaultPid(''); setSlideMode('edit'); setSlideOpen(true);
  }, []);
  const openReply = useCallback((parent: CommentaireProjet) => {
    setSlideCmt(null); setDefaultPid(parent.id); setSlideMode('new'); setSlideOpen(true);
  }, []);

  // ── Exports ──────────────────────────────────────────────────────────────────

  const exportCSV = useCallback(() => {
    const bom = '﻿';
    const headers = ['ID', 'Date', 'Auteur', 'Rôle', 'Module', 'Élément',
      'Statut', 'Priorité', 'Message', 'Pièce jointe', 'Mention', 'Parent'];
    const rows = commentaires.map(c => [
      c.id, c.date_creation, c.auteur, c.role, c.module, c.element_nom,
      STATUT_COMMENTAIRE_LABEL[c.statut], PRIORITE_COMMENTAIRE_LABEL[c.priorite],
      c.message, c.pieceJointeDocumentId ? 'Oui' : 'Non', c.mentionUserName ?? '', c.parent_id ?? '',
    ]);
    const csv  = bom + [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(';')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = 'commentaires.csv'; a.click();
    URL.revokeObjectURL(url);
  }, [commentaires]);

  const exportXLSX = useCallback(() => {
    const headers = ['ID', 'Date', 'Auteur', 'Rôle', 'Module', 'Élément',
      'Statut', 'Priorité', 'Message', 'Pièce jointe', 'Mention', 'Parent'];
    const rows = commentaires.map(c => [
      c.id, c.date_creation, c.auteur, c.role, c.module, c.element_nom,
      STATUT_COMMENTAIRE_LABEL[c.statut], PRIORITE_COMMENTAIRE_LABEL[c.priorite],
      c.message, c.pieceJointeDocumentId ? 'Oui' : 'Non', c.mentionUserName ?? '', c.parent_id ?? '',
    ]);
    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Commentaires');
    XLSX.writeFile(wb, 'commentaires.xlsx');
  }, [commentaires]);

  // ── Données SlideOver ────────────────────────────────────────────────────────

  // Résout le parent depuis slideCmt.parent_id (vue/édition d'une réponse
  // existante) OU depuis defaultPid (nouvelle réponse en cours de rédaction,
  // où slideCmt est encore null) — sans ce second cas, le formulaire de
  // réponse n'a aucun moyen d'afficher le contexte du commentaire parent.
  const parentRef = useMemo(() => {
    const parentId = slideCmt?.parent_id || defaultPid;
    if (!parentId) return null;
    return commentaires.find(c => c.id === parentId) ?? null;
  }, [slideCmt, defaultPid, commentaires]);

  const replies = useMemo(() => {
    if (!slideCmt || slideMode !== 'view') return [];
    return commentaires.filter(c => c.parent_id === slideCmt.id);
  }, [slideCmt, commentaires, slideMode]);

  // ── Colonnes ─────────────────────────────────────────────────────────────────

  const columns = useMemo<ColumnDef<CommentaireProjet, unknown>[]>(() => [
    {
      accessorKey: 'date_creation',
      header: 'Date',
      meta: { isSticky: true } as Record<string, unknown>,
      cell: ({ row }) => (
        <div className="flex flex-col gap-0.5 min-w-[70px]">
          <span className="font-mono text-[11px] text-foreground whitespace-nowrap">
            {fmtDate(row.original.date_creation)}
          </span>
          {row.original.lu === false && (
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-info shrink-0" aria-label="Non lu" />
          )}
        </div>
      ),
    },
    {
      accessorKey: 'auteur',
      header: 'Auteur',
      cell: ({ row }) => {
        const name     = row.original.auteur;
        const initials = name.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase();
        return (
          <div className="flex items-center gap-2 min-w-[130px]">
            <div className="h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold shrink-0">
              {initials}
            </div>
            <div className="flex flex-col gap-0">
              <span className="text-[12px] font-medium text-foreground truncate max-w-[100px]">{name}</span>
              <span className="text-[10px] text-muted-foreground truncate max-w-[100px]">{row.original.role}</span>
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
          {getValue() as ModuleCommentaire}
        </Badge>
      ),
    },
    {
      accessorKey: 'element_nom',
      header: 'Élément',
      cell: ({ row }) => (
        <div className="flex flex-col gap-0 max-w-[160px]">
          <span className="text-[12px] font-medium text-foreground truncate" title={row.original.element_nom}>
            {row.original.element_nom}
          </span>
          <span className="font-mono text-[10px] text-muted-foreground">{row.original.element_id}</span>
        </div>
      ),
    },
    {
      accessorKey: 'priorite',
      header: 'Priorité',
      cell: ({ getValue }) => {
        const p = getValue() as PrioriteCommentaire;
        return (
          <Badge variant={prioriteVariant(p)} className="text-[10px] whitespace-nowrap">
            {PRIORITE_COMMENTAIRE_LABEL[p]}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'statut',
      header: 'Statut',
      cell: ({ getValue }) => {
        const s = getValue() as StatutCommentaire;
        return (
          <Badge variant={statutVariant(s)} className="text-[10px] whitespace-nowrap">
            {STATUT_COMMENTAIRE_LABEL[s]}
          </Badge>
        );
      },
    },
    {
      id: 'piece_jointe',
      accessorFn: (row: CommentaireProjet) => row.pieceJointeDocumentId ? 'Oui' : 'Non',
      header: 'PJ',
      meta: { align: 'center' } as Record<string, unknown>,
      cell: ({ row }) => row.original.pieceJointeDocumentId
        ? (
          <button
            type="button"
            className="flex items-center justify-center w-full disabled:opacity-50"
            onClick={() => handleDownload(row.original)}
            disabled={downloadMutation.isPending}
            aria-label="Télécharger la pièce jointe"
          >
            <Paperclip className="h-3.5 w-3.5 text-info" />
          </button>
        )
        : <span className="text-[11px] text-muted-foreground text-center block">—</span>,
    },
    {
      accessorKey: 'message',
      header: 'Message',
      cell: ({ row }) => (
        <div className="flex flex-col gap-0.5 max-w-[280px]">
          {row.original.parent_id && (
            <span className="text-[10px] text-muted-foreground font-mono">↩ réponse</span>
          )}
          <span
            className="text-[12px] text-foreground line-clamp-2 leading-relaxed"
            title={row.original.message}
          >
            {row.original.message}
          </span>
        </div>
      ),
    },
    {
      id: 'actions',
      enableHiding: false,
      meta: { align: 'right', isStickyRight: true } as Record<string, unknown>,
      cell: ({ row }) => (
        <div className="flex items-center gap-1 justify-end">
          <Button variant="ghost" size="sm" aria-label="Voir" onClick={() => openView(row.original)}>
            <Eye className="h-3.5 w-3.5" />
          </Button>
          {canManageComment(row.original) && (
            <Button variant="ghost" size="sm" aria-label="Modifier" onClick={() => openEdit(row.original)}>
              <Pencil className="h-3.5 w-3.5" />
            </Button>
          )}
          {canManageComment(row.original) && (
            <Button
              variant="ghost" size="sm" aria-label="Supprimer"
              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={() => setDeleteTarget(row.original)}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      ),
    },
  ], [openView, openEdit, canManageComment, handleDownload, downloadMutation.isPending]);

  // ── JSX ──────────────────────────────────────────────────────────────────────

  return (
    <section aria-label="Commentaires collaboratifs" className="flex flex-col gap-6">

      {/* ── En-tête ──────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-border">
        <div>
          <h1 className="text-base font-bold text-foreground">Commentaires</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Espace collaboratif — observations, questions et décisions du projet
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
            Nouveau commentaire
          </Button>
        </div>
      </div>

      {actionError && (
        <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive" role="alert">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" aria-hidden="true" />
          <span>{actionError}</span>
        </div>
      )}

      {/* ── Alerte commentaires ouverts ───────────────────────────────────────── */}
      {ouvertsParents.length > 0 && (
        <div className="rounded-lg border border-warning/30 bg-warning/5 px-4 py-3 flex items-start gap-3">
          <AlertCircle className="h-4 w-4 text-warning mt-0.5 shrink-0" aria-hidden="true" />
          <div>
            <p className="text-sm font-semibold text-warning">
              {ouvertsParents.length} commentaire{ouvertsParents.length > 1 ? 's' : ''} ouvert{ouvertsParents.length > 1 ? 's' : ''} sans réponse
            </p>
            <ul className="mt-1 space-y-0.5">
              {ouvertsParents.slice(0, 5).map(c => (
                <li key={c.id} className="text-xs text-warning/80">
                  <span className="font-mono">[{c.element_id}]</span>{' '}
                  <strong>{c.module}</strong> — {c.auteur} —{' '}
                  <span className="font-medium">{fmtDate(c.date_creation)}</span>
                </li>
              ))}
              {ouvertsParents.length > 5 && (
                <li className="text-xs text-warning/60">
                  + {ouvertsParents.length - 5} autre{ouvertsParents.length - 5 > 1 ? 's' : ''}…
                </li>
              )}
            </ul>
          </div>
        </div>
      )}

      {/* ── KPIs ─────────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title="Total commentaires"
          value={kpis.total}
          icon={<MessageSquare className="h-4 w-4 text-primary" aria-hidden="true" />}
          iconVariant="primary"
          description="Dans le registre"
        />
        <StatCard
          title="Ouverts"
          value={kpis.ouverts}
          icon={<Clock className="h-4 w-4 text-warning" aria-hidden="true" />}
          iconVariant="warning"
          description="Ouvert ou en cours"
        />
        <StatCard
          title="Résolus"
          value={kpis.resolus}
          icon={<CheckCircle2 className="h-4 w-4 text-success" aria-hidden="true" />}
          iconVariant="success"
          description="Résolu ou fermé"
        />
        <StatCard
          title="Aujourd'hui"
          value={kpis.ajd}
          icon={<CalendarDays className="h-4 w-4 text-info" aria-hidden="true" />}
          iconVariant="info"
          description="Créés ce jour"
        />
        <StatCard
          title="Avec pièce jointe"
          value={kpis.avec_pj}
          icon={<Paperclip className="h-4 w-4 text-secondary-foreground" aria-hidden="true" />}
          iconVariant="default"
          description="Fichiers attachés"
        />
      </div>

      {/* ── Graphiques ───────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Par module */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Par module</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={moduleData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 8 }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: 6, fontSize: 11 }}
                  formatter={(v) => [`${v}`, 'Commentaires']}
                  cursor={{ fill: 'hsl(var(--muted))', opacity: 0.5 }}
                />
                <Bar dataKey="Commentaires" fill="hsl(var(--primary))" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Par statut */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Par statut</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={statutData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 9 }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: 6, fontSize: 11 }}
                  formatter={(v) => [`${v}`, 'Commentaires']}
                  cursor={{ fill: 'hsl(var(--muted))', opacity: 0.5 }}
                />
                <Bar dataKey="Commentaires" fill="hsl(var(--secondary-foreground))" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Évolution mensuelle */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Évolution mensuelle</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={evolutionData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="label" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: 6, fontSize: 11 }}
                  formatter={(v) => [`${v}`, 'Commentaires']}
                />
                <Legend wrapperStyle={{ fontSize: 11, color: 'hsl(var(--muted-foreground))' }} />
                <Line type="monotone" dataKey="Commentaires" stroke="hsl(var(--primary))" strokeWidth={2}
                  dot={{ fill: 'hsl(var(--primary))', r: 3 }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* ── DataTable ─────────────────────────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-base">Registre des commentaires</CardTitle>
          <span className="text-xs text-muted-foreground font-mono">{commentaires.length} entrées</span>
        </CardHeader>
        <CardContent className="p-0">
          <DataTable
            columns={columns}
            data={commentaires}
            searchKey="message"
            searchPlaceholder="Rechercher par message, auteur, élément…"
            filters={tableFilters}
          />
        </CardContent>
      </Card>

      {/* ── SlideOver ─────────────────────────────────────────────────────────── */}
      <CommentSlideOver
        open={slideOpen}
        onOpenChange={(open) => { setSlideOpen(open); if (!open) setActionError(null); }}
        mode={slideMode}
        commentaire={slideCmt}
        parentRef={parentRef}
        replies={replies}
        defaultParentId={defaultPid}
        projectId={projectId}
        canManage={slideCmt ? canManageComment(slideCmt) : true}
        canAttachFile={canAttachFile}
        isSaving={createMutation.isPending || updateMutation.isPending || uploadMutation.isPending}
        error={actionError}
        onSave={handleSave}
        onDelete={(id) => {
          const target = commentaires.find(c => c.id === id);
          if (target) { setSlideOpen(false); setActionError(null); setDeleteTarget(target); }
        }}
        onReply={openReply}
      />

      {/* ── Modal suppression ──────────────────────────────────────────────────── */}
      <Modal open={!!deleteTarget} onOpenChange={(open) => { if (!open) { setDeleteTarget(null); setActionError(null); } }}>
        <ModalContent>
          <ModalHeader>
            <ModalTitle>Supprimer le commentaire</ModalTitle>
            <ModalDescription>
              Êtes-vous sûr de vouloir supprimer ce commentaire de{' '}
              <strong>{deleteTarget?.auteur}</strong>{' '}
              ({deleteTarget?.module} — {deleteTarget?.element_nom}) ?
              Cette action supprimera également les réponses associées.
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
