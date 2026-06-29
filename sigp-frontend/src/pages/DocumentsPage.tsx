import { PageHeader } from '@/components/layout/PageHeader';
import { useState, useMemo, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Search, Download, FileText, FileSpreadsheet, File,
  FolderOpen, XCircle, Upload, Loader2,
} from 'lucide-react'
import { ColumnDef } from '@tanstack/react-table'
import { mockDocuments } from '@/mocks/documentsMock'
import type { DocumentMock } from '@/mocks/documentsMock'
import { StatCard }   from '@/components/ui/data-display/StatCard'
import { Badge }      from '@/components/ui/data-display/Badge'
import { Button }     from '@/components/ui/forms/Button'
import { Input }      from '@/components/ui/forms/Input'
import { DataTable }  from '@/components/ui/data-table/DataTable'

// ─── Hook local ──────────────────────────────────────────────────────────────

function useDocuments(search: string) {
  return useQuery({
    queryKey: ['documents', search],
    queryFn: async (): Promise<DocumentMock[]> => {
      await new Promise(resolve => setTimeout(resolve, 400))
      if (!search) return mockDocuments
      const q = search.toLowerCase()
      return mockDocuments.filter(
        d => d.nom.toLowerCase().includes(q) || (d.projet_nom ?? '').toLowerCase().includes(q)
      )
    },
  })
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatSize(ko: number): string {
  if (ko >= 1024) return `${(ko / 1024).toFixed(1)} Mo`
  return `${ko} Ko`
}

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' }).format(new Date(iso))
}

type DocBadgeVariant = 'destructive' | 'success' | 'info' | 'warning' | 'secondary'

function getTypeBadgeVariant(type: string): DocBadgeVariant {
  switch (type) {
    case 'PDF':  return 'destructive'
    case 'XLSX': return 'success'
    case 'DOCX': return 'info'
    case 'IMG':  return 'warning'
    default:     return 'secondary'
  }
}

function FileIcon({ type }: { type: string }) {
  if (type === 'XLSX') return <FileSpreadsheet className="h-5 w-5 text-success" aria-hidden="true" />
  if (type === 'DOCX') return <FileText         className="h-5 w-5 text-info"    aria-hidden="true" />
  if (type === 'PDF')  return <FileText         className="h-5 w-5 text-destructive" aria-hidden="true" />
  return                      <File             className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
}

function FileIconBg(type: string): string {
  if (type === 'XLSX') return 'bg-success/10'
  if (type === 'DOCX') return 'bg-info/10'
  if (type === 'PDF')  return 'bg-destructive/10'
  return 'bg-muted/30'
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DocumentsPage() {
  const [search, setSearch]               = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleSearch = (value: string) => {
    setSearch(value)
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => setDebouncedSearch(value), 300)
  }

  const { data: documents, isLoading, error } = useDocuments(debouncedSearch)

  // KPIs dynamiques depuis les données
  const kpis = useMemo(() => {
    const docs    = documents ?? []
    const totalKo = docs.reduce((sum, d) => sum + d.taille_ko, 0)
    return {
      total:  docs.length,
      pdfs:   docs.filter(d => d.type === 'PDF').length,
      autres: docs.filter(d => d.type !== 'PDF').length,
      taille: formatSize(totalKo),
    }
  }, [documents])

  // Colonnes DataTable
  const columns = useMemo<ColumnDef<DocumentMock>[]>(() => [
    {
      id: 'document',
      header: 'DOCUMENT',
      cell: ({ row }) => {
        const doc = row.original
        return (
          <div className="flex items-center gap-3 min-w-[220px]">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${FileIconBg(doc.type)}`}>
              <FileIcon type={doc.type} />
            </div>
            <div className="min-w-0">
              <p className="font-medium text-sm text-foreground truncate max-w-[260px]">{doc.nom}</p>
              {doc.projet_nom && (
                <p className="text-xs text-primary mt-0.5 truncate">{doc.projet_nom}</p>
              )}
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: 'type',
      header: 'TYPE',
      size: 80,
      meta: { align: 'center' },
      cell: ({ row }) => (
        <Badge variant={getTypeBadgeVariant(row.original.type)} className="font-mono text-[10px]">
          {row.original.type}
        </Badge>
      ),
    },
    {
      accessorKey: 'taille_ko',
      header: 'TAILLE',
      size: 90,
      meta: { align: 'right' },
      cell: ({ row }) => (
        <span className="font-mono tabular-nums text-xs text-muted-foreground">
          {formatSize(row.original.taille_ko)}
        </span>
      ),
    },
    {
      accessorKey: 'cree_par',
      header: 'AJOUTÉ PAR',
      size: 140,
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">{row.original.cree_par}</span>
      ),
    },
    {
      accessorKey: 'cree_le',
      header: 'DATE',
      size: 120,
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground whitespace-nowrap">
          {formatDate(row.original.cree_le)}
        </span>
      ),
    },
    {
      id: 'actions',
      header: '',
      size: 120,
      meta: { align: 'right' },
      cell: ({ row }) => (
        <a
          href={row.original.url}
          download
          target="_blank"
          rel="noreferrer"
          aria-label={`Télécharger ${row.original.nom}`}
          className="inline-flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
        >
          <Download className="h-3.5 w-3.5" />
          Télécharger
        </a>
      ),
    },
  ], [])

  return (
    <div className="flex flex-col h-full overflow-hidden bg-background">

      {/* ── HEADER ─────────────────────────────────────────────────────────── */}
      <div className="shrink-0 flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b border-border bg-card">
        <div>
          <PageHeader title="Gestion des Documents" description="
            Centralisez et consultez tous les documents liés aux projets.
          " />
        </div>
        <Button
          variant="default"
          size="sm"
          leftIcon={<Upload className="h-3.5 w-3.5" />}
          className="h-8 text-xs"
          aria-label="Uploader un nouveau document"
        >
          Uploader Document
        </Button>
      </div>

      {/* ── KPI STRIP ──────────────────────────────────────────────────────── */}
      <div className="shrink-0 grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 px-4 py-3 border-b border-border bg-muted/10">
        <StatCard
          title="Total documents"
          value={kpis.total}
          icon={<FolderOpen className="h-4 w-4" />}
          iconVariant="primary"
          description="Tous formats confondus"
        />
        <StatCard
          title="PDF"
          value={kpis.pdfs}
          icon={<FileText className="h-4 w-4" />}
          iconVariant="destructive"
          description="Fichiers PDF"
        />
        <StatCard
          title="Autres formats"
          value={kpis.autres}
          icon={<File className="h-4 w-4" />}
          iconVariant="info"
          description="XLSX, DOCX, etc."
        />
        <StatCard
          title="Volume total"
          value={kpis.taille}
          icon={<FileSpreadsheet className="h-4 w-4" />}
          iconVariant="default"
          description="Taille cumulée"
        />
      </div>

      {/* ── TOOLBAR RECHERCHE ──────────────────────────────────────────────── */}
      <div className="shrink-0 px-4 py-2.5 border-b border-border bg-muted/5">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" aria-hidden="true" />
          <Input
            type="text"
            placeholder="Rechercher un document…"
            value={search}
            onChange={e => handleSearch(e.target.value)}
            className="pl-9 h-8 text-sm"
            aria-label="Rechercher un document"
          />
        </div>
      </div>

      {/* ── CONTENU ────────────────────────────────────────────────────────── */}
      <div className="flex-1 min-h-0 overflow-auto">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground">
            <Loader2 className="h-7 w-7 animate-spin text-primary" aria-label="Chargement en cours" />
            <p className="text-sm">Chargement des documents…</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-center px-4">
            <XCircle className="h-10 w-10 text-destructive" aria-hidden="true" />
            <p className="font-semibold text-foreground">Erreur de chargement</p>
            <p className="text-sm text-muted-foreground">Impossible de récupérer les documents.</p>
          </div>
        ) : documents && documents.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-center px-4">
            <FolderOpen className="h-10 w-10 text-muted-foreground" aria-hidden="true" />
            <p className="font-semibold text-foreground">Aucun document</p>
            <p className="text-sm text-muted-foreground">
              {debouncedSearch
                ? 'Aucun résultat pour votre recherche.'
                : 'Les documents apparaîtront ici une fois uploadés.'}
            </p>
          </div>
        ) : (
          <div className="p-4">
            <div className="bg-card border border-border rounded-lg overflow-hidden">
              <div className="px-4 py-2.5 border-b border-border bg-muted/5 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-foreground">Tous les Documents</h2>
                <span className="text-xs text-muted-foreground">
                  {documents?.length ?? 0} fichier{(documents?.length ?? 0) !== 1 ? 's' : ''}
                </span>
              </div>
              <DataTable columns={columns} data={documents ?? []} />
            </div>
          </div>
        )}
      </div>

    </div>
  )
}
