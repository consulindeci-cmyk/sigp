import { useState, useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import {
  Download, Trash2, Star, StarOff, Search, SlidersHorizontal,
  FileText, Play, Eye,
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

// Mock data
import {
  mockReportTemplates,
  mockGeneratedReports,
  mockMonthlyExports,
  ALL_CATEGORIES,
  ALL_FORMATS,
  type ReportTemplate,
  type GeneratedReport,
  type GeneratedStatus,
  type ReportFormat,
  type ReportCategory,
  type ReportsKPIs,
} from '@/mocks/reportsMocks';

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
  onDuplicate,
  onDelete,
}: {
  category: ReportCategory;
  reports: ReportTemplate[];
  onGenerate: (r: ReportTemplate) => void;
  onPreview: (r: ReportTemplate) => void;
  onToggleFav: (id: string) => void;
  onDuplicate: (r: ReportTemplate) => void;
  onDelete: (r: ReportTemplate) => void;
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
            onDuplicate={onDuplicate}
            onDelete={onDelete}
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
  const [templates, setTemplates] = useState<ReportTemplate[]>(mockReportTemplates);
  const [generated, setGenerated] = useState<GeneratedReport[]>(mockGeneratedReports);

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
    setTemplates((prev) =>
      prev.map((t) => t.id === id ? { ...t, favori: !t.favori } : t)
    );
  }

  function handleDuplicate(report: ReportTemplate) {
    const dup: ReportTemplate = {
      ...report,
      id: `dup-${Date.now()}`,
      code: `${report.code}-COPY`,
      nom: `${report.nom} (Copie)`,
      favori: false,
      nombreExports: 0,
      dateCreation: new Date().toISOString().split('T')[0],
      dateDernierExport: '—',
    };
    setTemplates((prev) => [dup, ...prev]);
  }

  function openDelete(report: ReportTemplate) {
    setReportToDelete(report);
    setDeleteModalOpen(true);
  }

  function handleDeleteConfirm() {
    if (!reportToDelete) return;
    setTemplates((prev) => prev.filter((t) => t.id !== reportToDelete.id));
    setDeleteModalOpen(false);
    setReportToDelete(null);
  }

  function handleGenerated(report: ReportTemplate, format: ReportFormat) {
    const newEntry: GeneratedReport = {
      id: `g-${Date.now()}`,
      reportCode: report.code,
      reportNom: report.nom,
      format,
      dateGeneration: new Date().toLocaleString('fr-FR', {
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit',
      }).replace(',', ''),
      genereePar: 'Amadou Diallo',
      taille: `${(Math.random() * 4 + 0.2).toFixed(1)} Mo`,
      statut: 'Succès',
      categorie: report.categorie,
    };
    setGenerated((prev) => [newEntry, ...prev]);
    setTemplates((prev) =>
      prev.map((t) =>
        t.id === report.id
          ? { ...t, nombreExports: t.nombreExports + 1, dateDernierExport: newEntry.dateGeneration.split(' ')[0] }
          : t
      )
    );
  }

  function handleDeleteGenerated(id: string) {
    setGenerated((prev) => prev.filter((g) => g.id !== id));
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
            onClick: () => {},
            disabled: g.statut === 'Erreur',
          },
          {
            label: 'Supprimer',
            icon: <Trash2 className="h-3.5 w-3.5" />,
            onClick: () => handleDeleteGenerated(g.id),
            variant: 'destructive',
            separator: true,
          },
        ];
        return <ActionsMenu actions={actions} aria-label={`Actions pour ${g.reportNom}`} />;
      },
    },
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ], []);

  // ── Header actions ────────────────────────────────────────────────────────
  const headerActions = (
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
  );

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
                  onDuplicate={handleDuplicate}
                  onDelete={openDelete}
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
                  onDuplicate={handleDuplicate}
                  onDelete={openDelete}
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
                      <Button
                        variant="default" size="sm" className="flex-1 gap-1"
                        leftIcon={<Play className="h-3 w-3" />}
                        onClick={() => openGenerate(r)}
                        aria-label={`Générer ${r.nom}`}
                      >
                        Générer
                      </Button>
                      <Button
                        variant="outline" size="sm" className="gap-1"
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
            <ReportExportsChart data={mockMonthlyExports} />
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
        mode={sheetMode}
        onGenerated={handleGenerated}
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
          <ModalFooter>
            <ModalClose asChild>
              <Button variant="outline">Annuler</Button>
            </ModalClose>
            <Button variant="destructive" onClick={handleDeleteConfirm}>
              <Trash2 className="h-4 w-4 mr-1.5" aria-hidden="true" />
              Supprimer
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </ContentLayout>
  );
}
