import { useCallback, useMemo, useState } from 'react';
import * as XLSX from 'xlsx';
import {
  BarChart, Bar, PieChart, Pie, Cell, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import type { ColumnDef, PaginationState, ColumnFiltersState, Updater } from '@tanstack/react-table';
import {
  FileText, FileSpreadsheet, File, Archive, Image as ImageIcon,
  FolderOpen, Download, FileDown, Plus, Eye, Pencil, Trash2,
  RotateCcw, AlertCircle, CheckCircle2, Clock,
  BookOpen, ArchiveX,
} from 'lucide-react';
import type {
  DocumentGlobal, CategorieGlobalDoc, StatutGlobalDoc,
  ConfidentialiteGlobalDoc, TypeFichier,
} from '@/types';
import {
  STATUT_GLOBAL_DOC_LABEL, CONF_GLOBAL_DOC_LABEL,
  CATEGORIE_GLOBAL_DOC_OPTIONS, STATUT_GLOBAL_DOC_OPTIONS,
  CONF_GLOBAL_DOC_OPTIONS, TYPE_FICHIER_OPTIONS,
} from '@/mocks/globalDocumentsMocks';
import {
  useGlobalDocuments, useGlobalDocumentsKPIs, useUpdateGlobalDocument, useDeleteGlobalDocument,
} from '@/hooks/useGlobalDocuments';
import { useAuthStore } from '@/stores/authStore';
import { useOrganisationsList } from '@/hooks/useOrganisationsAdmin';
import { DocumentSlideOver } from '@/components/documents/DocumentSlideOver';
import type { DocumentSavePayload } from '@/components/documents/DocumentSlideOver';
import { DocumentCategoryTree } from '@/components/documents/DocumentCategoryTree';
import { DataTable }  from '@/components/ui/data-table/DataTable';
import { type DataTableFilter } from '@/components/ui/data-table/types';
import { StatCard }   from '@/components/ui/data-display/StatCard';
import { Badge }      from '@/components/ui/data-display/Badge';
import { Button }     from '@/components/ui/forms/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/data-display/Card';
import {
  Modal, ModalContent, ModalHeader, ModalTitle,
  ModalDescription, ModalFooter, ModalClose,
} from '@/components/ui/overlays/Modal';
import { PageHeader } from '@/components/layout/PageHeader';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch { return '—'; }
}

function fmtSize(ko: number): string {
  if (ko >= 1024 * 1024) return `${(ko / 1024 / 1024).toFixed(1)} Go`;
  if (ko >= 1024)        return `${(ko / 1024).toFixed(1)} Mo`;
  return `${ko} Ko`;
}

function statutVariant(s: StatutGlobalDoc): 'default' | 'success' | 'warning' | 'secondary' | 'destructive' | 'info' {
  if (s === 'PUBLIE')        return 'success';
  if (s === 'BROUILLON')     return 'secondary';
  if (s === 'EN_VALIDATION') return 'warning';
  if (s === 'ARCHIVE')       return 'info';
  if (s === 'EXPIRE')        return 'destructive';
  return 'default';
}

function confVariant(c: ConfidentialiteGlobalDoc): 'default' | 'success' | 'warning' | 'secondary' | 'destructive' | 'info' {
  if (c === 'PUBLIQUE')       return 'success';
  if (c === 'INTERNE')        return 'info';
  if (c === 'CONFIDENTIELLE') return 'warning';
  if (c === 'RESTREINTE')     return 'destructive';
  return 'default';
}

function FileIcon({ type }: { type: TypeFichier }) {
  if (type === 'Excel') return <FileSpreadsheet className="h-4 w-4 text-success" />;
  if (type === 'Word')  return <FileText className="h-4 w-4 text-info" />;
  if (type === 'PDF')   return <FileText className="h-4 w-4 text-destructive" />;
  if (type === 'Image') return <ImageIcon className="h-4 w-4 text-warning" />;
  if (type === 'ZIP')   return <Archive className="h-4 w-4 text-muted-foreground" />;
  return <File className="h-4 w-4 text-muted-foreground" />;
}

const PIE_COLORS = [
  'hsl(var(--success))',
  'hsl(var(--muted-foreground))',
  'hsl(var(--warning))',
  'hsl(var(--primary))',
  'hsl(var(--destructive))',
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DocumentsPage() {
  const isSuperAdmin = useAuthStore(s => s.user?.role === 'SUPER_ADMIN');
  const { data: organisationsForFilter } = useOrganisationsList(isSuperAdmin);

  // ── État pagination/filtres serveur (page/recherche/statut/organisation) —
  // même modèle que Users/Projects. categorie/type/confidentialite/auteur
  // restent des filtres client (voir plus bas) : encodés en JSON dans
  // `description`, pas des colonnes réelles, donc non résolvables serveur.
  const [paginationState, setPaginationState] = useState<PaginationState>({ pageIndex: 0, pageSize: 20 });
  const [columnFiltersState, setColumnFiltersState] = useState<ColumnFiltersState>([]);

  const handleColumnFiltersChange = useCallback((updater: Updater<ColumnFiltersState>) => {
    setColumnFiltersState(prev => typeof updater === 'function' ? updater(prev) : updater);
    setPaginationState(prev => ({ ...prev, pageIndex: 0 }));
  }, []);

  const queryParams = useMemo(() => {
    const titreFilter = columnFiltersState.find(f => f.id === 'titre');
    const search = typeof titreFilter?.value === 'string' && titreFilter.value.trim() !== '' ? titreFilter.value.trim() : undefined;

    const statutFilter = columnFiltersState.find(f => f.id === 'statut');
    const statut = typeof statutFilter?.value === 'string' && statutFilter.value !== '' ? (statutFilter.value as StatutGlobalDoc) : undefined;

    const organisationFilter = columnFiltersState.find(f => f.id === 'organisation');
    const organisationId = typeof organisationFilter?.value === 'string' && organisationFilter.value !== '' ? organisationFilter.value : undefined;

    return { search, statut, organisationId };
  }, [columnFiltersState]);

  const { data: docsPage, isLoading: isLoadingDocs } = useGlobalDocuments({
    page: paginationState.pageIndex + 1,
    limit: paginationState.pageSize,
    ...queryParams,
  });
  // Agrégat séparé (KPIs/graphiques) : mêmes filtres réels, pas de pagination —
  // découplé de la page de table affichée (même principe que useProjectsKPIs).
  const { data: kpiDocs } = useGlobalDocumentsKPIs(queryParams);

  const updateMutation = useUpdateGlobalDocument();
  const deleteMutation = useDeleteGlobalDocument();

  const pageDocs = useMemo(() => docsPage?.data ?? [], [docsPage]);
  const docs = useMemo(() => kpiDocs ?? [], [kpiDocs]);
  const pageCount = docsPage?.meta?.totalPages ?? 1;
  const rowCount = docsPage?.meta?.total ?? pageDocs.length;

  // "Nouveau document" : documents_projet.project_id est NOT NULL — un document
  // "global" (sans projet) ne peut littéralement pas y être inséré, useCreateGlobalDocument
  // reste un stub qui ne persiste jamais réellement (comportement d'origine).
  // draftDocs préserve l'illusion visuelle immédiate (prepend local), en dehors
  // du cycle de pagination serveur — ces lignes disparaissent au prochain refetch.
  const [draftDocs, setDraftDocs] = useState<DocumentGlobal[]>([]);

  const [slideOpen, setSlideOpen]   = useState(false);
  const [slideMode, setSlideMode]   = useState<'new' | 'edit' | 'view'>('new');
  const [slideDoc,  setSlideDoc]    = useState<DocumentGlobal | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DocumentGlobal | null>(null);
  const [selectedCat, setSelectedCat]   = useState<CategorieGlobalDoc | null>(null);

  // ── Documents affichés dans le tableau : page serveur + brouillons locaux,
  // filtrés côté client par catégorie (arbre) et par les filtres meta-encodés
  // (categorie/type/confidentialite/auteur) — ces derniers ne s'appliquent
  // donc qu'à la page courante, pas à l'ensemble de la bibliothèque.

  const categorieFilter = columnFiltersState.find(f => f.id === 'categorie')?.value as CategorieGlobalDoc | undefined;
  const typeFilter = columnFiltersState.find(f => f.id === 'type')?.value as TypeFichier | undefined;
  const confidentialiteFilter = columnFiltersState.find(f => f.id === 'confidentialite')?.value as ConfidentialiteGlobalDoc | undefined;
  const auteurFilter = columnFiltersState.find(f => f.id === 'auteur')?.value as string | undefined;

  const filteredDocs = useMemo(() => {
    const combined = [...draftDocs, ...pageDocs];
    return combined.filter(d =>
      (!selectedCat || d.categorie === selectedCat) &&
      (!categorieFilter || d.categorie === categorieFilter) &&
      (!typeFilter || d.type === typeFilter) &&
      (!confidentialiteFilter || d.confidentialite === confidentialiteFilter) &&
      (!auteurFilter || d.auteur === auteurFilter)
    );
  }, [draftDocs, pageDocs, selectedCat, categorieFilter, typeFilter, confidentialiteFilter, auteurFilter]);

  // ── KPIs (sur l'agrégat, pas la page affichée) ─────────────────────────────

  const kpis = useMemo(() => {
    const totalKo  = docs.reduce((s, d) => s + d.taille_ko, 0);
    const publies  = docs.filter(d => d.statut === 'PUBLIE').length;
    const brouil   = docs.filter(d => d.statut === 'BROUILLON').length;
    const archives = docs.filter(d => d.statut === 'ARCHIVE').length;
    return { total: rowCount, publies, brouil, archives, taille: fmtSize(totalKo) };
  }, [docs, rowCount]);

  // ── Alertes ─────────────────────────────────────────────────────────────────

  const alertDocs = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return docs.filter(d =>
      d.statut === 'EN_VALIDATION' ||
      d.statut === 'EXPIRE' ||
      (d.date_expiration && d.date_expiration < today && d.statut !== 'ARCHIVE'),
    );
  }, [docs]);

  // ── Données graphiques ───────────────────────────────────────────────────────

  const categorieData = useMemo(() =>
    CATEGORIE_GLOBAL_DOC_OPTIONS
      .map(o => ({
        name: o.label.length > 14 ? o.label.slice(0, 12) + '…' : o.label,
        fullName: o.label,
        Documents: docs.filter(d => d.categorie === o.value).length,
      }))
      .filter(d => d.Documents > 0)
      .sort((a, b) => b.Documents - a.Documents),
  [docs]);

  const pieData = useMemo(() =>
    STATUT_GLOBAL_DOC_OPTIONS
      .map(o => ({
        name: STATUT_GLOBAL_DOC_LABEL[o.value],
        value: docs.filter(d => d.statut === o.value).length,
      }))
      .filter(d => d.value > 0),
  [docs]);

  const evolutionData = useMemo(() => {
    const months: { label: string; Documents: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const dt = new Date();
      dt.setDate(1);
      dt.setMonth(dt.getMonth() - i);
      const mois  = dt.toISOString().slice(0, 7);
      const label = dt.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' });
      months.push({
        label,
        Documents: docs.filter(d => d.date_creation.startsWith(mois)).length,
      });
    }
    return months;
  }, [docs]);

  // ── Filtres ──────────────────────────────────────────────────────────────────

  const auteurOptions = useMemo(() => {
    const unique = [...new Set(docs.map(d => d.auteur))].sort();
    return unique.map(a => ({ label: a, value: a }));
  }, [docs]);

  const tableFilters = useMemo(() => {
    const filters: DataTableFilter[] = [
      {
        id: 'categorie',
        title: 'Catégorie',
        options: CATEGORIE_GLOBAL_DOC_OPTIONS.map(o => ({ label: o.label, value: o.value as string })),
      },
      {
        id: 'type',
        title: 'Type',
        options: TYPE_FICHIER_OPTIONS.map(o => ({ label: o.label, value: o.value as string })),
      },
      {
        id: 'statut',
        title: 'Statut',
        options: STATUT_GLOBAL_DOC_OPTIONS.map(o => ({ label: o.label, value: o.value as string })),
      },
      {
        id: 'auteur',
        title: 'Auteur',
        options: auteurOptions,
      },
      {
        id: 'confidentialite',
        title: 'Confidentialité',
        options: CONF_GLOBAL_DOC_OPTIONS.map(o => ({ label: o.label, value: o.value as string })),
      },
    ];
    if (isSuperAdmin) {
      filters.push({
        id: 'organisation',
        title: 'Organisation',
        options: (organisationsForFilter ?? []).map(o => ({ label: o.nom, value: o.id })),
      });
    }
    return filters;
  }, [auteurOptions, isSuperAdmin, organisationsForFilter]);

  // ── Handlers ─────────────────────────────────────────────────────────────────

  // Un doc "brouillon" (créé via le stub, jamais vraiment persisté) doit être
  // mis à jour localement plutôt que via une mutation réseau qui échouerait
  // (id inexistant côté serveur) — même fragilité pré-existante, juste rendue
  // explicite ici plutôt que masquée par la resynchronisation locale globale.
  const isDraft = useCallback((id: string) => draftDocs.some(d => d.id === id), [draftDocs]);

  const handleSave = useCallback((payload: DocumentSavePayload, id?: string) => {
    const now = new Date().toISOString();
    if (id) {
      const current = [...draftDocs, ...docs].find(d => d.id === id);
      if (!current) return;

      if (isDraft(id)) {
        setDraftDocs(prev => prev.map(d => d.id === id ? { ...d, ...payload, updatedAt: now } : d));
        return;
      }

      updateMutation.mutate({
        id,
        titre: payload.titre,
        changes: {
          categorie:         payload.categorie,
          type:              payload.type,
          version:           payload.version,
          confidentialite:   payload.confidentialite,
          auteur:            payload.auteur,
          service:           payload.service,
          mots_cles:         payload.mots_cles,
          taille_ko:         payload.taille_ko,
          date_expiration:   payload.date_expiration,
          feStatut:          payload.statut,
          date_modification: payload.date_modification,
        },
        current,
      });
    } else {
      setDraftDocs(prev => {
        const all = [...prev, ...docs];
        const max = all.reduce((m, d) => {
          const n = parseInt(d.id.replace('gdoc-', ''), 10);
          return isNaN(n) ? m : Math.max(m, n);
        }, 0);
        const catCode = payload.categorie.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 3);
        const catMax = all.filter(d => d.categorie === payload.categorie).length;
        const newDoc: DocumentGlobal = {
          id:                `gdoc-${String(max + 1).padStart(3, '0')}`,
          code_document:     `DOC-${catCode}-${String(catMax + 1).padStart(3, '0')}`,
          ...payload,
          nb_telechargements: 0,
          nb_commentaires:    0,
          versions:           [{ version: payload.version, date: payload.date_creation, auteur: payload.auteur, changements: 'Version initiale' }],
          createdAt:          now,
          updatedAt:          now,
        };
        return [newDoc, ...prev];
      });
    }
  }, [docs, draftDocs, isDraft, updateMutation]);

  const handleDeleteConfirm = useCallback(() => {
    if (!deleteTarget) return;
    if (isDraft(deleteTarget.id)) {
      setDraftDocs(prev => prev.filter(d => d.id !== deleteTarget.id));
    } else {
      deleteMutation.mutate(deleteTarget.id);
    }
    setDeleteTarget(null);
  }, [deleteTarget, isDraft, deleteMutation]);

  const handleArchive = useCallback((doc: DocumentGlobal) => {
    const today = new Date().toISOString().slice(0, 10);
    if (isDraft(doc.id)) {
      setDraftDocs(prev => prev.map(d => d.id === doc.id ? { ...d, statut: 'ARCHIVE' as const, date_modification: today } : d));
      return;
    }
    updateMutation.mutate({
      id: doc.id,
      changes: { feStatut: 'ARCHIVE', date_modification: today },
      current: doc,
    });
  }, [isDraft, updateMutation]);

  const handleRestore = useCallback((doc: DocumentGlobal) => {
    const today = new Date().toISOString().slice(0, 10);
    if (isDraft(doc.id)) {
      setDraftDocs(prev => prev.map(d => d.id === doc.id ? { ...d, statut: 'PUBLIE' as const, date_modification: today } : d));
      return;
    }
    updateMutation.mutate({
      id: doc.id,
      changes: { feStatut: 'PUBLIE', date_modification: today },
      current: doc,
    });
  }, [isDraft, updateMutation]);

  const handleNewVersion = useCallback((doc: DocumentGlobal) => {
    const today = new Date().toISOString().slice(0, 10);
    const parts  = doc.version.split('.');
    const newVer = `${parseInt(parts[0], 10) + 1}.0`;
    const newVersions = [...doc.versions, {
      version:     newVer,
      date:        today,
      auteur:      doc.auteur,
      changements: `Mise à jour v${newVer}`,
    }];
    if (isDraft(doc.id)) {
      setDraftDocs(prev => prev.map(d =>
        d.id === doc.id ? { ...d, version: newVer, statut: 'EN_VALIDATION', date_modification: today, versions: newVersions } : d,
      ));
      return;
    }
    updateMutation.mutate({
      id: doc.id,
      changes: { version: newVer, feStatut: 'EN_VALIDATION', date_modification: today, versions: newVersions },
      current: doc,
    });
  }, [isDraft, updateMutation]);

  const handleDownload = useCallback((doc: DocumentGlobal) => {
    const today = new Date().toISOString().slice(0, 10);
    if (isDraft(doc.id)) {
      setDraftDocs(prev => prev.map(d => d.id === doc.id ? { ...d, nb_telechargements: d.nb_telechargements + 1, date_modification: today } : d));
      return;
    }
    updateMutation.mutate({
      id: doc.id,
      changes: { nb_telechargements: doc.nb_telechargements + 1, date_modification: today },
      current: doc,
    });
  }, [isDraft, updateMutation]);

  const openNew  = useCallback(() => {
    setSlideDoc(null); setSlideMode('new'); setSlideOpen(true);
  }, []);
  const openView = useCallback((d: DocumentGlobal) => {
    setSlideDoc(d); setSlideMode('view'); setSlideOpen(true);
  }, []);
  const openEdit = useCallback((d: DocumentGlobal) => {
    setSlideDoc(d); setSlideMode('edit'); setSlideOpen(true);
  }, []);

  // ── Exports ──────────────────────────────────────────────────────────────────

  const exportCSV = useCallback(() => {
    const bom = '﻿';
    const headers = ['Code', 'Titre', 'Catégorie', 'Type', 'Version', 'Auteur', 'Service',
      'Statut', 'Confidentialité', 'Taille', 'Téléchargements', 'Date création', 'Date modification'];
    const rows = docs.map(d => [
      d.code_document, d.titre, d.categorie, d.type, d.version,
      d.auteur, d.service,
      STATUT_GLOBAL_DOC_LABEL[d.statut],
      CONF_GLOBAL_DOC_LABEL[d.confidentialite],
      fmtSize(d.taille_ko), d.nb_telechargements,
      d.date_creation, d.date_modification,
    ]);
    const csv  = bom + [headers, ...rows].map(r =>
      r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(';'),
    ).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = 'documents.csv'; a.click();
    URL.revokeObjectURL(url);
  }, [docs]);

  const exportXLSX = useCallback(() => {
    const headers = ['Code', 'Titre', 'Catégorie', 'Type', 'Version', 'Auteur', 'Service',
      'Statut', 'Confidentialité', 'Taille (Ko)', 'Téléchargements', 'Date création', 'Date modification'];
    const rows = docs.map(d => [
      d.code_document, d.titre, d.categorie, d.type, d.version,
      d.auteur, d.service,
      STATUT_GLOBAL_DOC_LABEL[d.statut],
      CONF_GLOBAL_DOC_LABEL[d.confidentialite],
      d.taille_ko, d.nb_telechargements,
      d.date_creation, d.date_modification,
    ]);
    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Documents');
    XLSX.writeFile(wb, 'documents.xlsx');
  }, [docs]);

  // ── Colonnes ─────────────────────────────────────────────────────────────────

  const columns = useMemo<ColumnDef<DocumentGlobal, unknown>[]>(() => [
    {
      accessorKey: 'code_document',
      header: 'Code',
      meta: { isSticky: true } as Record<string, unknown>,
      cell: ({ row }) => (
        <div className="flex items-center gap-2 min-w-[130px]">
          <div className="flex-shrink-0">
            <FileIcon type={row.original.type} />
          </div>
          <div className="flex flex-col gap-0">
            <span className="font-mono text-[10px] text-muted-foreground">
              {row.original.code_document}
            </span>
            <span className="text-[10px] text-muted-foreground font-mono">v{row.original.version}</span>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'titre',
      header: 'Titre',
      cell: ({ row }) => (
        <div className="min-w-[200px] max-w-[280px]">
          <p className="text-[12px] font-semibold text-foreground line-clamp-2 leading-snug" title={row.original.titre}>
            {row.original.titre}
          </p>
          <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{row.original.service}</p>
        </div>
      ),
    },
    {
      accessorKey: 'categorie',
      header: 'Catégorie',
      cell: ({ getValue }) => (
        <Badge variant="outline" className="text-[9px] whitespace-nowrap">
          {getValue() as CategorieGlobalDoc}
        </Badge>
      ),
    },
    {
      accessorKey: 'type',
      header: 'Type',
      meta: { align: 'center' } as Record<string, unknown>,
      cell: ({ getValue }) => {
        const t = getValue() as TypeFichier;
        return (
          <Badge variant="secondary" className="text-[10px] font-mono whitespace-nowrap">
            {t}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'auteur',
      header: 'Auteur',
      cell: ({ row }) => {
        const name     = row.original.auteur;
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
      accessorKey: 'date_modification',
      header: 'Date',
      cell: ({ row }) => (
        <span className="font-mono text-[11px] text-muted-foreground whitespace-nowrap">
          {fmtDate(row.original.date_modification)}
        </span>
      ),
    },
    {
      accessorKey: 'statut',
      header: 'Statut',
      cell: ({ getValue }) => {
        const s = getValue() as StatutGlobalDoc;
        return (
          <Badge variant={statutVariant(s)} className="text-[10px] whitespace-nowrap">
            {STATUT_GLOBAL_DOC_LABEL[s]}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'confidentialite',
      header: 'Confidentialité',
      cell: ({ getValue }) => {
        const c = getValue() as ConfidentialiteGlobalDoc;
        return (
          <Badge variant={confVariant(c)} className="text-[10px] whitespace-nowrap">
            {CONF_GLOBAL_DOC_LABEL[c]}
          </Badge>
        );
      },
    },
    {
      id: 'actions',
      enableHiding: false,
      meta: { align: 'right', isStickyRight: true } as Record<string, unknown>,
      cell: ({ row }) => {
        const d = row.original;
        const isArchived = d.statut === 'ARCHIVE';
        return (
          <div className="flex items-center gap-1 justify-end">
            <Button variant="ghost" size="sm" aria-label="Voir" onClick={() => openView(d)}>
              <Eye className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="sm" aria-label="Modifier" onClick={() => openEdit(d)}>
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost" size="sm" aria-label="Télécharger"
              className="text-primary hover:bg-primary/10 hover:text-primary"
              onClick={() => handleDownload(d)}
            >
              <Download className="h-3.5 w-3.5" />
            </Button>
            {isArchived ? (
              <Button
                variant="ghost" size="sm" aria-label="Restaurer"
                className="text-success hover:bg-success/10 hover:text-success"
                onClick={() => handleRestore(d)}
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </Button>
            ) : (
              <Button
                variant="ghost" size="sm" aria-label="Archiver"
                className="text-info hover:bg-info/10 hover:text-info"
                onClick={() => handleArchive(d)}
              >
                <ArchiveX className="h-3.5 w-3.5" />
              </Button>
            )}
            <Button
              variant="ghost" size="sm" aria-label="Supprimer"
              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={() => setDeleteTarget(d)}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        );
      },
    },
  ], [openView, openEdit, handleDownload, handleRestore, handleArchive]);

  // ── JSX ──────────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col min-h-full bg-background">

      {/* ── HEADER ─────────────────────────────────────────────────────────── */}
      <div className="shrink-0 px-4 sm:px-6 lg:px-8 pt-4 pb-0 bg-background">
        <div className="flex flex-wrap items-start justify-between gap-3 pb-4 border-b border-border">
          <PageHeader
            title="Bibliothèque documentaire"
            description="Gestion centralisée de tous les documents institutionnels"
          />
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="h-8 text-xs" onClick={exportCSV}>
              <FileDown className="h-3.5 w-3.5 mr-1.5" aria-hidden="true" />
              CSV
            </Button>
            <Button variant="outline" size="sm" className="h-8 text-xs" onClick={exportXLSX}>
              <FileSpreadsheet className="h-3.5 w-3.5 mr-1.5" aria-hidden="true" />
              Excel
            </Button>
            <Button size="sm" className="h-8 text-xs" onClick={openNew}>
              <Plus className="h-3.5 w-3.5 mr-1.5" aria-hidden="true" />
              Nouveau document
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 px-4 sm:px-6 lg:px-8 pt-6 pb-20 sm:pb-20 lg:pb-20 flex flex-col gap-6">

        {/* ── Alerte ────────────────────────────────────────────────────────── */}
        {alertDocs.length > 0 && (
          <div className="rounded-lg border border-warning/30 bg-warning/5 px-4 py-3 flex items-start gap-3">
            <AlertCircle className="h-4 w-4 text-warning mt-0.5 shrink-0" aria-hidden="true" />
            <div>
              <p className="text-sm font-semibold text-warning">
                {alertDocs.length} document{alertDocs.length > 1 ? 's' : ''} nécessitent une attention
              </p>
              <ul className="mt-1 space-y-0.5">
                {alertDocs.slice(0, 5).map(d => (
                  <li key={d.id} className="text-xs text-warning/80">
                    <span className="font-mono">[{d.code_document}]</span>{' '}
                    <strong>{d.titre}</strong> —{' '}
                    <span className="font-medium">{STATUT_GLOBAL_DOC_LABEL[d.statut]}</span>
                  </li>
                ))}
                {alertDocs.length > 5 && (
                  <li className="text-xs text-warning/60">
                    + {alertDocs.length - 5} autre{alertDocs.length - 5 > 1 ? 's' : ''}…
                  </li>
                )}
              </ul>
            </div>
          </div>
        )}

        {/* ── KPIs ──────────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <StatCard
            title="Total documents"
            value={kpis.total}
            icon={<FolderOpen className="h-4 w-4 text-primary" aria-hidden="true" />}
            iconVariant="primary"
            description="Dans la bibliothèque"
          />
          <StatCard
            title="Publiés"
            value={kpis.publies}
            icon={<CheckCircle2 className="h-4 w-4 text-success" aria-hidden="true" />}
            iconVariant="success"
            description="Accessibles"
          />
          <StatCard
            title="Brouillons"
            value={kpis.brouil}
            icon={<Clock className="h-4 w-4 text-secondary-foreground" aria-hidden="true" />}
            iconVariant="default"
            description="En préparation"
          />
          <StatCard
            title="Archivés"
            value={kpis.archives}
            icon={<BookOpen className="h-4 w-4 text-info" aria-hidden="true" />}
            iconVariant="info"
            description="En archive"
          />
          <StatCard
            title="Volume total"
            value={kpis.taille}
            icon={<FileText className="h-4 w-4 text-warning" aria-hidden="true" />}
            iconVariant="warning"
            description="Taille cumulée"
          />
        </div>

        {/* ── Graphiques ────────────────────────────────────────────────────── */}
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
                  <XAxis dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 7 }} axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: 6, fontSize: 11 }}
                    formatter={(v) => [`${v}`, 'Documents']}
                    labelFormatter={(_, payload) => payload[0]?.payload?.fullName ?? ''}
                    cursor={{ fill: 'hsl(var(--muted))', opacity: 0.5 }}
                  />
                  <Bar dataKey="Documents" fill="hsl(var(--primary))" radius={[3, 3, 0, 0]} />
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
                    innerRadius={45}
                    outerRadius={75}
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
                    formatter={(v) => [`${v}`, 'Documents']}
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Évolution mensuelle */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Ajouts par mois</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={evolutionData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="label" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: 6, fontSize: 11 }}
                    formatter={(v) => [`${v}`, 'Documents']}
                  />
                  <Legend wrapperStyle={{ fontSize: 11, color: 'hsl(var(--muted-foreground))' }} />
                  <Line
                    type="monotone" dataKey="Documents" stroke="hsl(var(--primary))" strokeWidth={2}
                    dot={{ fill: 'hsl(var(--primary))', r: 3 }} activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* ── Table + CategoryTree ──────────────────────────────────────────── */}
        <div className="flex gap-4 items-start">

          {/* Arbre catégories */}
          <Card className="shrink-0 w-[220px] hidden lg:block">
            <CardContent className="p-3">
              <DocumentCategoryTree
                documents={docs}
                selected={selectedCat}
                onSelect={setSelectedCat}
              />
            </CardContent>
          </Card>

          {/* DataTable */}
          <Card className="flex-1 min-w-0">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base">
                  {selectedCat ? selectedCat : 'Tous les documents'}
                </CardTitle>
                {selectedCat && (
                  <button
                    onClick={() => setSelectedCat(null)}
                    className="text-[10px] text-muted-foreground hover:text-primary underline mt-0.5"
                  >
                    Effacer le filtre
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground font-mono">{filteredDocs.length} document{filteredDocs.length !== 1 ? 's' : ''}</span>
                <Button size="sm" className="h-7 text-xs" onClick={openNew}>
                  <Plus className="h-3.5 w-3.5 mr-1" aria-hidden="true" />
                  Ajouter
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <DataTable
                columns={columns}
                data={filteredDocs}
                isLoading={isLoadingDocs}
                searchKey="titre"
                searchPlaceholder="Rechercher par titre, auteur, code…"
                filters={tableFilters}
                manualPagination
                pageCount={pageCount}
                rowCount={rowCount}
                pagination={paginationState}
                onPaginationChange={setPaginationState}
                manualFiltering
                columnFilters={columnFiltersState}
                onColumnFiltersChange={handleColumnFiltersChange}
              />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ── SlideOver ─────────────────────────────────────────────────────────── */}
      <DocumentSlideOver
        open={slideOpen}
        onOpenChange={setSlideOpen}
        mode={slideMode}
        document={slideDoc}
        onSave={handleSave}
        onDelete={(id) => {
          const target = [...draftDocs, ...docs].find(d => d.id === id);
          if (target) { setSlideOpen(false); setDeleteTarget(target); }
        }}
        onDownload={handleDownload}
        onNewVersion={handleNewVersion}
        auteurOptions={auteurOptions.map(o => o.value)}
      />

      {/* ── Modal suppression ──────────────────────────────────────────────────── */}
      <Modal open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <ModalContent>
          <ModalHeader>
            <ModalTitle>Supprimer le document</ModalTitle>
            <ModalDescription>
              Êtes-vous sûr de vouloir supprimer{' '}
              <strong>{deleteTarget?.titre}</strong>{' '}
              ({deleteTarget?.code_document}) ?{' '}
              Cette action est irréversible.
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
    </div>
  );
}
