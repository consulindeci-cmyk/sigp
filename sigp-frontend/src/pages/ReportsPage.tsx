import { useState, useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import {
  Download, Trash2, Star, StarOff, Search, SlidersHorizontal,
  FileText, Play, Eye, AlertCircle,
} from 'lucide-react';
import { ContentLayout } from '@/components/layout/ContentLayout';
import { PageHeader } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/forms/Button';
import { Input } from '@/components/ui/forms/Input';
import { Select } from '@/components/ui/forms/Select';
import { Badge } from '@/components/ui/data-display/Badge';
import { Card, CardContent } from '@/components/ui/data-display/Card';
import { DataTable } from '@/components/ui/data-table/DataTable';
import { DataTableFilter } from '@/components/ui/data-table/types';
import {
  Tabs, TabsList, TabsTrigger, TabsContent,
} from '@/components/ui/navigation/Tabs';
import {
  Modal, ModalContent, ModalHeader, ModalTitle, ModalDescription,
  ModalFooter, ModalClose,
} from '@/components/ui/overlays/Modal';
import { ActionsMenu, type ActionItem } from '@/components/projects/ActionsMenu';

// Reports components
import { ReportKPIs } from '@/components/reports/ReportKPIs';
import { ReportCatalogCard, formatBadgeVariant, frequencyBadgeVariant } from '@/components/reports/ReportCatalogCard';
import { ReportGenerationSheet, type GenerationMode } from '@/components/reports/ReportGenerationSheet';
import { ReportExportsChart } from '@/components/reports/ReportExportsChart';

// Mock labels/options (static — no data mocks)
import {
  ALL_CATEGORIES,
  ALL_FORMATS,
  type ReportTemplate,
  type GeneratedReport,
  type GeneratedStatus,
  type ReportFormat,
  type ReportCategory,
  type ReportsKPIs,
  type MonthlyExportsData,
} from '@/mocks/reportsMocks';
import type { RapportProjet, TypeRapport, FormatRapport } from '@/types';
import { useReports, useDeleteReport } from '@/hooks/useReports';
import { useDownloadDocumentVersion } from '@/hooks/useDocuments';
import { useAuthStore } from '@/stores/authStore';

// ── Adapters: RapportProjet → ReportPage types ────────────────────────────────

const TYPE_TO_CATEGORY: Record<TypeRapport, ReportCategory> = {
  MENSUEL:     'Synthèse & Tableau de bord',
  TRIMESTRIEL: 'Synthèse & Tableau de bord',
  ANNUEL:      'Synthèse & Tableau de bord',
  AVANCEMENT:  'Synthèse & Tableau de bord',
  BAILLEUR:    'Synthèse & Tableau de bord',
  FINAL:       'Synthèse & Tableau de bord',
  FINANCIER:   'Budget & Finance',
  PTBA:        'Planification & PTBA',
  RISQUES:     'Risques',
  EVM:         'EVM & Performance',
};

const TYPE_TO_FREQUENCE: Record<TypeRapport, ReportTemplate['frequence']> = {
  MENSUEL:     'Mensuel',
  TRIMESTRIEL: 'Trimestriel',
  FINANCIER:   'Mensuel',
  EVM:         'Mensuel',
  RISQUES:     'Mensuel',
  PTBA:        'Trimestriel',
  ANNUEL:      'Manuel',
  AVANCEMENT:  'Manuel',
  BAILLEUR:    'Manuel',
  FINAL:       'Manuel',
};

function beFormatToFe(f: FormatRapport): ReportFormat {
  if (f === 'Excel') return 'XLSX';
  if (f === 'Word')  return 'DOCX';
  return 'PDF';
}

function fmtTailleStr(ko: number): string {
  if (ko < 1024)        return `${ko} Ko`;
  if (ko < 1024 * 1024) return `${(ko / 1024).toFixed(1)} Mo`;
  return `${(ko / (1024 * 1024)).toFixed(1)} Go`;
}

function adaptToGenerated(r: RapportProjet): GeneratedReport {
  const genStat: GeneratedStatus =
    r.statut === 'EN_ATTENTE' ? 'En cours' : 'Succès';
  return {
    id:             r.id,
    reportCode:     r.code_rapport,
    reportNom:      r.titre,
    format:         beFormatToFe(r.format),
    dateGeneration: r.date_generation,
    genereePar:     r.auteur,
    taille:         fmtTailleStr(r.taille_ko),
    statut:         genStat,
    categorie:      TYPE_TO_CATEGORY[r.type],
    documentId:     r.documentId,
  };
}

function buildTemplates(rapports: RapportProjet[]): ReportTemplate[] {
  const seen = new Map<string, ReportTemplate>();
  for (const r of [...rapports].sort((a, b) =>
    a.date_generation.localeCompare(b.date_generation)
  )) {
    const code = r.code_rapport;
    if (!seen.has(code)) {
      seen.set(code, {
        id:                 r.id,
        code,
        nom:                r.titre,
        categorie:          TYPE_TO_CATEGORY[r.type],
        description:        r.description ?? '',
        formatsDisponibles: [beFormatToFe(r.format)],
        auteur:             r.auteur,
        dateCreation:       r.createdAt.slice(0, 10),
        dateDernierExport:  r.date_generation,
        statut:             r.statut === 'ARCHIVE' ? 'Archivé' : 'Disponible',
        frequence:          TYPE_TO_FREQUENCE[r.type],
        favori:             false,
        nombreExports:      r.nb_telechargements,
      });
    } else {
      const t = seen.get(code)!;
      const fmt = beFormatToFe(r.format);
      if (!t.formatsDisponibles.includes(fmt)) t.formatsDisponibles.push(fmt);
      t.nombreExports += r.nb_telechargements;
      if (r.date_generation > t.dateDernierExport) t.dateDernierExport = r.date_generation;
    }
  }
  return Array.from(seen.values());
}

function buildMonthlyExports(rapports: RapportProjet[]): MonthlyExportsData[] {
  return Array.from({ length: 12 }, (_, i) => {
    const dt = new Date();
    dt.setDate(1);
    dt.setMonth(dt.getMonth() - (11 - i));
    const mois  = dt.toISOString().slice(0, 7);
    const label = dt.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' });
    const exports = rapports
      .filter(r => r.date_generation.startsWith(mois))
      .reduce((s, r) => s + r.nb_telechargements + 1, 0);
    return { mois: label, exports };
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// History DataTable filters
// ─────────────────────────────────────────────────────────────────────────────

const FORMAT_FILTER_OPTIONS = ALL_FORMATS.map((f) => ({ label: f, value: f }));

const STATUS_FILTER_OPTIONS: { label: string; value: GeneratedStatus }[] = [
  { label: 'Succès', value: 'Succès' },
  { label: 'Erreur', value: 'Erreur' },
  { label: 'En cours', value: 'En cours' },
];

const historyFilters: DataTableFilter[] = [
  { id: 'format', title: 'Format', options: FORMAT_FILTER_OPTIONS },
  { id: 'statut', title: 'Statut', options: STATUS_FILTER_OPTIONS },
];

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function generatedStatusVariant(s: GeneratedStatus): 'success' | 'destructive' | 'default' {
  switch (s) {
    case 'Succès':    return 'success';
    case 'Erreur':    return 'destructive';
    case 'En cours':  return 'default';
    default:          return 'default';
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Category section header
// ─────────────────────────────────────────────────────────────────────────────

function CategorySection({
  category,
  reports,
  onGenerate,
  onPreview,
  onToggleFav,
  onDelete,
  canManage,
  canDelete,
}: {
  category: ReportCategory;
  reports: ReportTemplate[];
  onGenerate: (r: ReportTemplate) => void;
  onPreview: (r: ReportTemplate) => void;
  onToggleFav: (id: string) => void;
  onDelete: (r: ReportTemplate) => void;
  canManage: boolean;
  canDelete: boolean;
}) {
  if (reports.length === 0) return null;
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <h2 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
          {category}
        </h2>
        <div className="flex-1 h-px bg-border" aria-hidden="true" />
        <span className="text-[10px] text-muted-foreground">{reports.length}</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {reports.map((r) => (
          <ReportCatalogCard
            key={r.id}
            report={r}
            onGenerate={onGenerate}
            onPreview={onPreview}
            onToggleFav={onToggleFav}
            onDelete={onDelete}
            canManage={canManage}
            canDelete={canDelete}
          />
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ReportsPage
// ─────────────────────────────────────────────────────────────────────────────

export default function ReportsPage() {
  const { data: apiRapports } = useReports();
  const deleteMutation = useDeleteReport();
  const downloadMutation = useDownloadDocumentVersion();
  const currentRole = useAuthStore((s) => s.user?.role);

  // Miroir des rôles serveur : requireRole sur reports-create/update
  // (COORDINATEUR/CHARGE_PROGRAMME/ADMIN/SUPER_ADMIN) et -delete (ADMIN/SUPER_ADMIN).
  const canManage = !!currentRole && ['COORDINATEUR', 'CHARGE_PROGRAMME', 'ADMIN', 'SUPER_ADMIN'].includes(currentRole);
  const canDelete = currentRole === 'ADMIN' || currentRole === 'SUPER_ADMIN';

  // Un même "code" de modèle peut regrouper des rapports de plusieurs projets
  // (cf. buildTemplates) — on retient le type réel le plus récent par code
  // pour pouvoir régénérer une ligne rapports_projet cohérente.
  const codeToType = useMemo(() => {
    const map = new Map<string, TypeRapport>();
    for (const r of apiRapports ?? []) map.set(r.code_rapport, r.type);
    return map;
  }, [apiRapports]);

  // "favori" est une préférence purement locale (aucune colonne backend) —
  // seul état réellement local légitime ici, distinct des données serveur
  // (cf. audit : l'ancien useEffect+setState copiait aussi templates/generated,
  // qui sont maintenant dérivés directement de apiRapports, jamais recopiés).
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());

  const templates = useMemo(() => {
    if (!apiRapports) return [];
    return buildTemplates(apiRapports).map(t => ({ ...t, favori: favoriteIds.has(t.id) }));
  }, [apiRapports, favoriteIds]);

  const generated = useMemo(
    () => (apiRapports ?? []).map(adaptToGenerated),
    [apiRapports],
  );

  const monthlyExports = useMemo(
    () => buildMonthlyExports(apiRapports ?? []),
    [apiRapports],
  );

  // Catalogue filters
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<ReportCategory | ''>('');
  const [formatFilter, setFormatFilter] = useState<ReportFormat | ''>('');

  // Sheet state
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetMode, setSheetMode] = useState<GenerationMode>('generate');
  const [selectedReport, setSelectedReport] = useState<ReportTemplate | null>(null);

  // Delete template modal
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [reportToDelete, setReportToDelete] = useState<ReportTemplate | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  // ── Dynamic KPIs ──────────────────────────────────────────────────────────
  const kpis = useMemo<ReportsKPIs>(() => ({
    totalTemplates: templates.length,
    generesParMois: generated.filter((g) => g.dateGeneration.startsWith('2026-06')).length,
    favoris: templates.filter((t) => t.favori).length,
    planifies: templates.filter((t) => t.frequence !== 'Manuel').length,
  }), [templates, generated]);

  // ── Filtered catalogue ────────────────────────────────────────────────────
  const filteredTemplates = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return templates.filter((t) => {
      const matchSearch = !q
        || t.nom.toLowerCase().includes(q)
        || t.description.toLowerCase().includes(q)
        || t.code.toLowerCase().includes(q);
      const matchCat = !categoryFilter || t.categorie === categoryFilter;
      const matchFmt = !formatFilter || t.formatsDisponibles.includes(formatFilter as ReportFormat);
      return matchSearch && matchCat && matchFmt;
    });
  }, [templates, searchQuery, categoryFilter, formatFilter]);

  // Templates grouped by category
  const grouped = useMemo(() => {
    return ALL_CATEGORIES.reduce<Record<string, ReportTemplate[]>>((acc, cat) => {
      acc[cat] = filteredTemplates.filter((t) => t.categorie === cat);
      return acc;
    }, {} as Record<string, ReportTemplate[]>);
  }, [filteredTemplates]);

  // Recent reports (last 6 generated)
  const recentTemplates = useMemo(() => {
    return [...templates]
      .sort((a, b) => b.dateDernierExport.localeCompare(a.dateDernierExport))
      .slice(0, 6);
  }, [templates]);

  // Favoris
  const favoriteTemplates = useMemo(() => templates.filter((t) => t.favori), [templates]);

  // ── Actions ───────────────────────────────────────────────────────────────
  function openGenerate(report: ReportTemplate) {
    setSelectedReport(report);
    setSheetMode('generate');
    setSheetOpen(true);
  }

  function openPreview(report: ReportTemplate) {
    setSelectedReport(report);
    setSheetMode('preview');
    setSheetOpen(true);
  }

  function handleToggleFav(id: string) {
    setFavoriteIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function openDelete(report: ReportTemplate) {
    setReportToDelete(report);
    setDeleteError(null);
    setDeleteModalOpen(true);
  }

  function handleDeleteConfirm() {
    if (!reportToDelete) return;
    deleteMutation.mutate(reportToDelete.id, {
      onSuccess: () => {
        setDeleteModalOpen(false);
        setReportToDelete(null);
      },
      onError: (err) => {
        setDeleteError(err instanceof Error ? err.message : 'Échec de la suppression du rapport.');
      },
    });
  }

  function handleDeleteGenerated(id: string) {
    setDownloadError(null);
    deleteMutation.mutate(id, {
      onError: (err) => {
        setDownloadError(err instanceof Error ? err.message : 'Échec de la suppression du rapport.');
      },
    });
  }

  function handleDownloadGenerated(g: GeneratedReport) {
    if (!g.documentId) return;
    setDownloadError(null);
    downloadMutation.mutate(g.documentId, {
      onSuccess: (data) => {
        window.open(data.url, '_blank', 'noopener,noreferrer');
      },
      onError: (err) => {
        setDownloadError(err instanceof Error ? err.message : 'Échec du téléchargement du rapport.');
      },
    });
  }

  // ── History DataTable columns ─────────────────────────────────────────────
  const historyColumns = useMemo<ColumnDef<GeneratedReport, any>[]>(() => [
    {
      id: 'searchHist',
      accessorFn: (row) => `${row.reportNom} ${row.genereePar} ${row.categorie}`,
      header: '',
      cell: () => null,
      enableHiding: true,
    },
    {
      accessorKey: 'reportNom',
      header: 'RAPPORT',
      meta: { isSticky: true } as any,
      cell: ({ row }) => (
        <div className="flex flex-col gap-0.5 min-w-[160px]">
          <div className="flex items-center gap-1.5">
            <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" aria-hidden="true" />
            <span className="text-[13px] font-semibold text-foreground">{row.original.reportNom}</span>
          </div>
          <Badge variant="outline" className="text-[10px] w-max ml-5">{row.original.categorie}</Badge>
        </div>
      ),
    },
    {
      accessorKey: 'format',
      header: 'FORMAT',
      cell: ({ getValue }) => {
        const f = getValue() as ReportFormat;
        return <Badge variant={formatBadgeVariant(f)} className="text-[11px] w-max">{f}</Badge>;
      },
    },
    {
      accessorKey: 'dateGeneration',
      header: 'DATE',
      cell: ({ getValue }) => (
        <span className="font-mono text-[11px] text-muted-foreground">{getValue() as string}</span>
      ),
    },
    {
      accessorKey: 'genereePar',
      header: 'GÉNÉRÉ PAR',
      cell: ({ getValue }) => (
        <span className="text-[12px] text-foreground">{getValue() as string}</span>
      ),
    },
    {
      accessorKey: 'taille',
      header: 'TAILLE',
      meta: { align: 'right' } as any,
      cell: ({ getValue }) => (
        <span className="font-mono text-[11px] text-muted-foreground">{getValue() as string}</span>
      ),
    },
    {
      accessorKey: 'statut',
      header: 'STATUT',
      cell: ({ getValue }) => {
        const s = getValue() as GeneratedStatus;
        return <Badge variant={generatedStatusVariant(s)} className="text-[11px] w-max">{s}</Badge>;
      },
    },
    {
      id: 'actions',
      enableHiding: false,
      meta: { align: 'right' } as any,
      cell: ({ row }) => {
        const g = row.original;
        const actions: ActionItem[] = [
          {
            label: 'Télécharger',
            icon: <Download className="h-3.5 w-3.5" />,
            onClick: () => handleDownloadGenerated(g),
            disabled: g.statut === 'Erreur' || !g.documentId,
          },
        ];
        if (canDelete) {
          actions.push({
            label: 'Supprimer',
            icon: <Trash2 className="h-3.5 w-3.5" />,
            onClick: () => handleDeleteGenerated(g.id),
            variant: 'destructive',
            separator: true,
          });
        }
        return <ActionsMenu actions={actions} aria-label={`Actions pour ${g.reportNom}`} />;
      },
    },
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [canDelete]);

  // ── Header actions ────────────────────────────────────────────────────────
  const headerActions = canManage ? (
    <Button
      variant="default"
      leftIcon={<Play className="h-4 w-4" />}
      onClick={() => {
        setSelectedReport(templates[0] ?? null);
        setSheetMode('generate');
        setSheetOpen(true);
      }}
    >
      Générer un rapport
    </Button>
  ) : undefined;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <ContentLayout>
      <PageHeader
        title="Rapports & Exports"
        subtitle={`${templates.length} modèles disponibles — ${kpis.generesParMois} exports ce mois · ${kpis.favoris} favoris`}
        actions={headerActions}
        className="mb-2"
      />

      {/* KPI Strip */}
      <ReportKPIs kpis={kpis} />

      {/* Tabs */}
      <Tabs defaultValue="catalogue">
        <TabsList className="mb-4">
          <TabsTrigger value="catalogue">
            Catalogue
            <Badge variant="outline" className="ml-1.5 text-[10px] px-1.5 py-0">{templates.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="favoris">
            Favoris
            <Badge variant="warning" className="ml-1.5 text-[10px] px-1.5 py-0">{favoriteTemplates.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="recents">Récents</TabsTrigger>
          <TabsTrigger value="historique">Historique</TabsTrigger>
        </TabsList>

        {/* ── Catalogue ────────────────────────────────────────────── */}
        <TabsContent value="catalogue">
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2 mb-5">
            <div className="relative flex-1 min-w-[200px] max-w-xs">
              <Search
                className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                placeholder="Rechercher un rapport..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9"
                aria-label="Rechercher dans le catalogue"
              />
            </div>
            <Select
              className="h-9 min-w-[160px]"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value as ReportCategory | '')}
              aria-label="Filtrer par catégorie"
            >
              <option value="">Toutes les catégories</option>
              {ALL_CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </Select>
            <Select
              className="h-9 min-w-[120px]"
              value={formatFilter}
              onChange={(e) => setFormatFilter(e.target.value as ReportFormat | '')}
              aria-label="Filtrer par format"
            >
              <option value="">Tous les formats</option>
              {ALL_FORMATS.map((f) => (
                <option key={f} value={f}>{f}</option>
              ))}
            </Select>
            {(searchQuery || categoryFilter || formatFilter) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { setSearchQuery(''); setCategoryFilter(''); setFormatFilter(''); }}
                className="h-9 text-muted-foreground"
                leftIcon={<SlidersHorizontal className="h-3.5 w-3.5" />}
              >
                Réinitialiser
              </Button>
            )}
          </div>

          {filteredTemplates.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-2 text-muted-foreground">
              <FileText className="h-10 w-10 opacity-40" aria-hidden="true" />
              <p className="text-sm font-medium">Aucun rapport ne correspond aux filtres</p>
            </div>
          ) : (
            <div className="flex flex-col gap-8">
              {ALL_CATEGORIES.map((cat) => (
                <CategorySection
                  key={cat}
                  category={cat}
                  reports={grouped[cat] ?? []}
                  onGenerate={openGenerate}
                  onPreview={openPreview}
                  onToggleFav={handleToggleFav}
                  onDelete={openDelete}
                  canManage={canManage}
                  canDelete={canDelete}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* ── Favoris ──────────────────────────────────────────────── */}
        <TabsContent value="favoris">
          {favoriteTemplates.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-2 text-muted-foreground">
              <StarOff className="h-10 w-10 opacity-40" aria-hidden="true" />
              <p className="text-sm font-medium">Aucun rapport en favoris</p>
              <p className="text-[12px]">Cliquez sur l'étoile d'un rapport pour l'ajouter.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {favoriteTemplates.map((r) => (
                <ReportCatalogCard
                  key={r.id}
                  report={r}
                  onGenerate={openGenerate}
                  onPreview={openPreview}
                  onToggleFav={handleToggleFav}
                  onDelete={openDelete}
                  canManage={canManage}
                  canDelete={canDelete}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* ── Récents ──────────────────────────────────────────────── */}
        <TabsContent value="recents">
          <div className="flex flex-col gap-3">
            <p className="text-[11px] text-muted-foreground">
              Les 6 modèles les plus récemment exportés
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {recentTemplates.map((r) => (
                <Card key={r.id} className="hover:shadow-sm transition-shadow duration-150">
                  <CardContent className="pt-4 flex flex-col gap-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <Badge variant="outline" className="font-mono text-[10px]">{r.code}</Badge>
                      <div className="flex items-center gap-1">
                        <Badge variant={frequencyBadgeVariant(r.frequence)} className="text-[10px]">{r.frequence}</Badge>
                        {r.favori && <Star className="h-3 w-3 fill-warning text-warning shrink-0" aria-label="Favori" />}
                      </div>
                    </div>
                    <p className="text-[13px] font-semibold text-foreground leading-snug">{r.nom}</p>
                    <div className="flex flex-wrap gap-1">
                      {r.formatsDisponibles.map((f) => (
                        <Badge key={f} variant={formatBadgeVariant(f)} className="text-[10px] px-1.5 py-0">{f}</Badge>
                      ))}
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-muted-foreground border-t border-border pt-2">
                      <span>Dernier export : <span className="font-mono">{r.dateDernierExport}</span></span>
                      <span>{r.nombreExports} fois</span>
                    </div>
                    <div className="flex gap-2">
                      {canManage && (
                        <Button
                          variant="default" size="sm" className="flex-1 gap-1"
                          leftIcon={<Play className="h-3 w-3" />}
                          onClick={() => openGenerate(r)}
                          aria-label={`Générer ${r.nom}`}
                        >
                          Générer
                        </Button>
                      )}
                      <Button
                        variant="outline" size="sm" className={canManage ? 'gap-1' : 'flex-1 gap-1'}
                        leftIcon={<Eye className="h-3 w-3" />}
                        onClick={() => openPreview(r)}
                        aria-label={`Aperçu de ${r.nom}`}
                      >
                        Aperçu
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* ── Historique ───────────────────────────────────────────── */}
        <TabsContent value="historique">
          <div className="flex flex-col gap-6">
            {downloadError && (
              <div className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-[12px] text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
                {downloadError}
              </div>
            )}
            <ReportExportsChart data={monthlyExports} />
            <DataTable
              columns={historyColumns}
              data={generated}
              searchKey="searchHist"
              searchPlaceholder="Rechercher dans l'historique..."
              filters={historyFilters}
            />
          </div>
        </TabsContent>
      </Tabs>

      {/* ── Generation Sheet ─────────────────────────────────────────────── */}
      <ReportGenerationSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        report={selectedReport}
        reportType={codeToType.get(selectedReport?.code ?? '') ?? 'AVANCEMENT'}
        mode={sheetMode}
        canManage={canManage}
      />

      {/* ── Delete Template Modal ────────────────────────────────────────── */}
      <Modal open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <ModalContent>
          <ModalHeader>
            <ModalTitle>Supprimer le modèle</ModalTitle>
            <ModalDescription>
              Êtes-vous sûr de vouloir supprimer{' '}
              <strong className="text-foreground">{reportToDelete?.nom}</strong> ?
              Cette action est irréversible et supprimera ce modèle du catalogue.
            </ModalDescription>
          </ModalHeader>
          {deleteError && (
            <div className="mx-6 flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-[12px] text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
              {deleteError}
            </div>
          )}
          <ModalFooter>
            <ModalClose asChild>
              <Button variant="outline">Annuler</Button>
            </ModalClose>
            <Button variant="destructive" onClick={handleDeleteConfirm} disabled={deleteMutation.isPending}>
              <Trash2 className="h-4 w-4 mr-1.5" aria-hidden="true" />
              Supprimer
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </ContentLayout>
  );
}
