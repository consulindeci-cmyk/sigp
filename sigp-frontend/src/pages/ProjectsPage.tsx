import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Plus, Search, ArrowRight, Loader2, X, Download, ChevronDown,
  FileSpreadsheet, FileText, File, Filter, AlertTriangle, Check,
  RotateCcw
} from 'lucide-react'
import * as XLSX from 'xlsx'
import { PageHeader } from '@/components/layout/AppShell'
import { StatusBadge } from '@/components/shared/Badges'
import { useProjects, useCreateProject } from '@/hooks/useProjects'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { StatutProjet } from '@/types'

const schema = z.object({
  code_projet: z.string().min(1, 'Requis'),
  nom_projet: z.string().min(1, 'Requis'),
  bailleur_principal: z.string().min(1, 'Requis'),
  date_debut: z.string().min(1, 'Requis'),
  date_fin: z.string().min(1, 'Requis'),
  budget_total: z.string().min(1, 'Requis'),
  devise: z.string().min(1, 'Requis'),
  description: z.string().optional(),
})
type FormData = z.infer<typeof schema>

type ExportScope = 'current' | 'all' | 'selected'
type ExportFormat = 'xlsx' | 'csv' | 'print'

interface ExportOptions {
  scope: ExportScope
  format: ExportFormat
  reportType: 'list' | 'financial'
  filename: string
  includeInfos: boolean
  includeBudget: boolean
  includeTasks: boolean
  includeStatus: boolean
}

const today = new Date().toISOString().slice(0, 10).replace(/-/g, '_')

export default function ProjectsPage() {
  const [search, setSearch] = useState('')
  const [statut, setStatut] = useState<StatutProjet | ''>('')
  const [page, setPage] = useState(1)
  const [showModal, setShowModal] = useState(false)

  // Export state
  const [showExportMenu, setShowExportMenu] = useState(false)
  const [showExportModal, setShowExportModal] = useState(false)
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    scope: 'current',
    format: 'xlsx',
    reportType: 'list',
    filename: `projets_${today}.xlsx`,
    includeInfos: true,
    includeBudget: true,
    includeTasks: true,
    includeStatus: true,
  })
  const exportMenuRef = useRef<HTMLDivElement>(null)

  // Row selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const { data, isLoading } = useProjects({ search: search || undefined, statut: statut || undefined, page, limit: 20 })
  const { data: allData } = useProjects({ page: 1, limit: 9999 })
  const createMutation = useCreateProject()

  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { devise: 'XOF' },
  })

  const projets = data?.data ?? []
  const allProjets = allData?.data ?? []
  const meta = data?.meta

  // Close export menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target as Node)) {
        setShowExportMenu(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Update filename when format changes
  useEffect(() => {
    const ext = exportOptions.format === 'xlsx' ? 'xlsx' : exportOptions.format === 'csv' ? 'csv' : 'pdf'
    setExportOptions(s => ({ ...s, filename: `projets_${today}.${ext}` }))
  }, [exportOptions.format])

  const onSubmit = async (values: FormData) => {
    await createMutation.mutateAsync(values)
    reset()
    setShowModal(false)
  }

  // ── Selection helpers ────────────────────────────────────────
  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const toggleSelectAll = () => {
    if (selectedIds.size === projets.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(projets.map(p => p.id)))
    }
  }

  const clearSelection = () => setSelectedIds(new Set())

  // ── Export logic ─────────────────────────────────────────────
  const getDataToExport = () => {
    if (exportOptions.scope === 'selected') return allProjets.filter(p => selectedIds.has(p.id))
    if (exportOptions.scope === 'all') return allProjets
    return projets // 'current' = filtered view
  }

  const buildRows = (rows: typeof projets) => {
    if (exportOptions.reportType === 'financial') {
      return rows.map(p => ({
        'Code Projet': p.code_projet,
        'Nom du Projet': p.nom_projet,
        'Bailleur Principal': p.bailleur_principal,
        'Budget Initial': Number(p.budget_total),
        'Devise': p.devise,
        'Date Début': formatDate(p.date_debut),
        'Date Fin': formatDate(p.date_fin),
        'Statut': p.statut,
      }))
    }
    return rows.map(p => ({
      ...(exportOptions.includeInfos ? {
        'Code': p.code_projet,
        'Nom du Projet': p.nom_projet,
        'Bailleur': p.bailleur_principal,
        'Date Début': formatDate(p.date_debut),
        'Date Fin': formatDate(p.date_fin),
      } : {}),
      ...(exportOptions.includeBudget ? {
        'Budget Total': Number(p.budget_total),
        'Devise': p.devise,
      } : {}),
      ...(exportOptions.includeTasks ? { 'Nbre Tâches': p._count?.taches ?? 0 } : {}),
      ...(exportOptions.includeStatus ? { 'Statut': p.statut } : {}),
    }))
  }

  const doExport = () => {
    const rows = buildRows(getDataToExport())
    if (rows.length === 0) return

    if (exportOptions.format === 'csv') {
      const headers = Object.keys(rows[0])
      const csvContent = [
        headers.join(';'),
        ...rows.map(r => headers.map(h => `"${(r as Record<string, string | number>)[h] ?? ''}"`).join(';'))
      ].join('\n')
      const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a'); a.href = url; a.download = exportOptions.filename; a.click()
      URL.revokeObjectURL(url)
    } else if (exportOptions.format === 'xlsx') {
      const ws = XLSX.utils.json_to_sheet(rows)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Projets')
      XLSX.writeFile(wb, exportOptions.filename)
    } else if (exportOptions.format === 'print') {
      // Open print window
      const tableRows = getDataToExport()
      const html = `
        <!DOCTYPE html><html><head>
        <title>${exportOptions.filename}</title>
        <style>
          body { font-family: Arial, sans-serif; font-size: 11px; color: #000; margin: 20px; }
          h1 { font-size: 16px; margin-bottom: 4px; }
          p { font-size: 11px; color: #666; margin-bottom: 16px; }
          table { width: 100%; border-collapse: collapse; }
          th, td { border: 1px solid #ccc; padding: 6px 8px; text-align: left; }
          th { background: #1a2340; color: white; font-size: 10px; text-transform: uppercase; }
          tr:nth-child(even) { background: #f5f7fa; }
          .badge { display: inline-block; padding: 2px 6px; border-radius: 3px; font-size: 9px; font-weight: bold; }
          .ACTIF { background: #d1fae5; color: #065f46; }
          .SUSPENDU { background: #fef3c7; color: #92400e; }
          .CLOTURE { background: #e0e7ff; color: #3730a3; }
          .ANNULE { background: #fee2e2; color: #991b1b; }
          @media print { body { margin: 0; } }
        </style></head><body>
        <h1>Rapport — Liste des Projets</h1>
        <p>Généré le ${new Date().toLocaleDateString('fr-FR')} — ${tableRows.length} projet(s)</p>
        <table>
          <thead><tr>
            <th>Code</th><th>Nom du Projet</th><th>Bailleur</th>
            <th>Budget</th><th>Statut</th><th>Début</th><th>Fin</th>
          </tr></thead>
          <tbody>${tableRows.map(p => `<tr>
            <td>${p.code_projet}</td>
            <td>${p.nom_projet}</td>
            <td>${p.bailleur_principal}</td>
            <td>${formatCurrency(p.budget_total, p.devise)}</td>
            <td><span class="badge ${p.statut}">${p.statut}</span></td>
            <td>${formatDate(p.date_debut)}</td>
            <td>${formatDate(p.date_fin)}</td>
          </tr>`).join('')}</tbody>
        </table>
        </body></html>`
      const win = window.open('', '_blank')
      if (win) { win.document.write(html); win.document.close(); win.print() }
    }

    setShowExportModal(false)
  }

  const openExport = (scope: ExportScope = 'current') => {
    setExportOptions(s => ({ ...s, scope }))
    setShowExportMenu(false)
    setShowExportModal(true)
  }

  const hasData = projets.length > 0 || allProjets.length > 0

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Projets"
        subtitle={`${meta?.total ?? 0} projet(s) au total`}
        actions={
          <div className="flex items-center gap-2">
            {/* Export button */}
            <div className="relative" ref={exportMenuRef}>
              <button
                onClick={() => hasData && setShowExportMenu(v => !v)}
                disabled={!hasData}
                title={!hasData ? 'Aucun projet disponible à exporter.' : undefined}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border border-navy-500 text-sigp-muted hover:text-sigp-text hover:border-sigp-blue rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Download size={13} />
                Exporter
                <ChevronDown size={12} className={`transition-transform ${showExportMenu ? 'rotate-180' : ''}`} />
              </button>

              {showExportMenu && (
                <div className="absolute right-0 top-full mt-1 w-56 bg-navy-800 border border-navy-500 rounded-xl shadow-2xl z-30 py-1 overflow-hidden">
                  <div className="px-3 py-1.5 text-[10px] font-bold text-sigp-muted uppercase tracking-wider border-b border-navy-500">Périmètre</div>
                  <button onClick={() => openExport('current')} className="w-full text-left flex items-center gap-2 px-4 py-2 text-xs text-sigp-text hover:bg-navy-700 transition-colors">
                    <Filter size={12} className="text-sigp-blue" /> Vue actuelle (avec filtres)
                  </button>
                  <button onClick={() => openExport('all')} className="w-full text-left flex items-center gap-2 px-4 py-2 text-xs text-sigp-text hover:bg-navy-700 transition-colors">
                    <FileText size={12} className="text-sigp-muted" /> Tous les projets
                  </button>
                  <button onClick={() => openExport('selected')} disabled={selectedIds.size === 0} className="w-full text-left flex items-center gap-2 px-4 py-2 text-xs text-sigp-text hover:bg-navy-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                    <Check size={12} className="text-sigp-muted" /> Sélection ({selectedIds.size})
                  </button>

                  <div className="px-3 py-1.5 text-[10px] font-bold text-sigp-muted uppercase tracking-wider border-t border-b border-navy-500 mt-1">Rapports</div>
                  <button onClick={() => { setExportOptions(s => ({...s, scope: 'all', reportType: 'financial'})); setShowExportMenu(false); setShowExportModal(true) }} className="w-full text-left flex items-center gap-2 px-4 py-2 text-xs text-sigp-text hover:bg-navy-700 transition-colors">
                    <FileSpreadsheet size={12} className="text-emerald-400" /> Rapport financier
                  </button>
                </div>
              )}
            </div>

            <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-1.5">
              <Plus size={14} /> Nouveau Projet
            </button>
          </div>
        }
      />

      {/* Selection action bar */}
      {selectedIds.size > 0 && (
        <div className="flex items-center justify-between px-6 py-2.5 bg-sigp-blue/10 border-b border-sigp-blue/30 text-sm">
          <span className="text-sigp-blue font-semibold flex items-center gap-2">
            <Check size={14} /> {selectedIds.size} projet(s) sélectionné(s)
          </span>
          <div className="flex gap-2">
            <button onClick={() => openExport('selected')} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-sigp-blue text-white rounded-lg hover:bg-sigp-blue-light transition-colors">
              <Download size={12} /> Exporter la sélection
            </button>
            <button onClick={clearSelection} className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-sigp-muted hover:text-sigp-text border border-navy-500 rounded-lg transition-colors">
              <X size={12} /> Annuler
            </button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-3 px-6 py-3 border-b border-navy-500 bg-navy-800/30">
        <div className="relative flex-1 max-w-sm">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-sigp-muted" />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
            placeholder="Rechercher un projet..."
            className="sigp-input pl-8 py-1.5 text-xs"
          />
        </div>
        <select
          value={statut}
          onChange={e => { setStatut(e.target.value as StatutProjet | ''); setPage(1) }}
          className="sigp-input w-36 py-1.5 text-xs"
        >
          <option value="">Tous statuts</option>
          {['PREPARATION', 'ACTIF', 'SUSPENDU', 'CLOTURE', 'ANNULE'].map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        {(search || statut) && (
          <button onClick={() => { setSearch(''); setStatut(''); setPage(1) }} className="flex items-center gap-1.5 text-xs text-sigp-muted hover:text-sigp-text border border-navy-500 px-2.5 py-1.5 rounded-lg transition-colors">
            <RotateCcw size={11} /> Réinitialiser
          </button>
        )}
      </div>

      {/* Table */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex justify-center py-16"><Loader2 className="animate-spin text-sigp-muted" /></div>
        ) : projets.length === 0 ? (
          <div className="text-center py-16 text-sigp-muted space-y-3">
            {(search || statut) ? (
              <>
                <AlertTriangle size={32} className="mx-auto text-sigp-muted/50" />
                <p className="font-medium">Aucun résultat pour ces filtres</p>
                <div className="flex items-center justify-center gap-3 mt-4">
                  <button onClick={() => { setSearch(''); setStatut('') }} className="flex items-center gap-1.5 text-xs border border-navy-500 px-3 py-1.5 rounded-lg hover:text-sigp-text transition-colors">
                    <RotateCcw size={11} /> Réinitialiser les filtres
                  </button>
                  <button onClick={() => openExport('all')} disabled={allProjets.length === 0} className="flex items-center gap-1.5 text-xs bg-sigp-blue/10 text-sigp-blue border border-sigp-blue/30 px-3 py-1.5 rounded-lg hover:bg-sigp-blue/20 transition-colors disabled:opacity-40">
                    <Download size={11} /> Exporter tous les projets
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="mb-2">Aucun projet trouvé</p>
                <button onClick={() => setShowModal(true)} className="text-sigp-blue hover:underline text-sm">
                  Créer votre premier projet
                </button>
              </>
            )}
          </div>
        ) : (
          <table className="excel-table">
            <thead>
              <tr>
                <th className="w-8">
                  <input
                    type="checkbox"
                    checked={projets.length > 0 && selectedIds.size === projets.length}
                    onChange={toggleSelectAll}
                    className="accent-sigp-blue cursor-pointer"
                  />
                </th>
                <th>Code</th>
                <th>Nom du Projet</th>
                <th>Bailleur</th>
                <th>Début</th>
                <th>Fin</th>
                <th className="text-right">Budget</th>
                <th>Devise</th>
                <th>Statut</th>
                <th>Tâches</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {projets.map(p => (
                <tr key={p.id} className={selectedIds.has(p.id) ? 'bg-sigp-blue/5' : ''}>
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedIds.has(p.id)}
                      onChange={() => toggleSelect(p.id)}
                      className="accent-sigp-blue cursor-pointer"
                    />
                  </td>
                  <td className="font-mono text-sigp-blue font-medium">{p.code_projet}</td>
                  <td className="max-w-xs truncate font-medium">{p.nom_projet}</td>
                  <td className="text-sigp-muted">{p.bailleur_principal}</td>
                  <td className="font-mono text-sigp-muted text-xs">{formatDate(p.date_debut)}</td>
                  <td className="font-mono text-sigp-muted text-xs">{formatDate(p.date_fin)}</td>
                  <td className="text-right font-mono">{formatCurrency(p.budget_total, p.devise)}</td>
                  <td className="text-sigp-muted font-mono text-xs">{p.devise}</td>
                  <td><StatusBadge statut={p.statut} /></td>
                  <td className="text-center text-sigp-muted">{p._count?.taches ?? 0}</td>
                  <td>
                    <Link
                      to={`/projects/${p.id}/dashboard`}
                      className="flex items-center gap-1 text-xs text-sigp-blue hover:text-sigp-blue-light"
                    >
                      Ouvrir <ArrowRight size={11} />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-between px-6 py-3 border-t border-navy-500 text-xs text-sigp-muted">
          <span>{meta.total} projets · Page {meta.page}/{meta.totalPages}</span>
          <div className="flex gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn-ghost py-1 px-2 disabled:opacity-40">← Préc.</button>
            <button onClick={() => setPage(p => Math.min(meta.totalPages, p + 1))} disabled={page === meta.totalPages} className="btn-ghost py-1 px-2 disabled:opacity-40">Suiv. →</button>
          </div>
        </div>
      )}

      {/* ── Modal Création ─────────────────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-navy-800 border border-navy-500 rounded-xl w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-navy-500">
              <h3 className="text-sm font-semibold text-sigp-text">Nouveau Projet</h3>
              <button onClick={() => setShowModal(false)} className="text-sigp-muted hover:text-sigp-text"><X size={16} /></button>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-sigp-muted mb-1 block">Code projet *</label>
                  <input {...register('code_projet')} placeholder="PAEP-CI-2025" className="sigp-input" />
                  {errors.code_projet && <p className="text-sigp-red text-xs mt-1">{errors.code_projet.message}</p>}
                </div>
                <div>
                  <label className="text-xs text-sigp-muted mb-1 block">Devise</label>
                  <select {...register('devise')} className="sigp-input">
                    <option value="XOF">XOF (FCFA)</option>
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs text-sigp-muted mb-1 block">Nom du projet *</label>
                <input {...register('nom_projet')} placeholder="Projet d'Accès à l'Eau Potable" className="sigp-input" />
                {errors.nom_projet && <p className="text-sigp-red text-xs mt-1">{errors.nom_projet.message}</p>}
              </div>
              <div>
                <label className="text-xs text-sigp-muted mb-1 block">Bailleur principal *</label>
                <input {...register('bailleur_principal')} placeholder="Banque Mondiale" className="sigp-input" />
                {errors.bailleur_principal && <p className="text-sigp-red text-xs mt-1">{errors.bailleur_principal.message}</p>}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-sigp-muted mb-1 block">Date début *</label>
                  <input {...register('date_debut')} type="date" className="sigp-input" />
                </div>
                <div>
                  <label className="text-xs text-sigp-muted mb-1 block">Date fin *</label>
                  <input {...register('date_fin')} type="date" className="sigp-input" />
                </div>
              </div>
              <div>
                <label className="text-xs text-sigp-muted mb-1 block">Budget total *</label>
                <input {...register('budget_total')} placeholder="2500000.00" className="sigp-input" />
                {errors.budget_total && <p className="text-sigp-red text-xs mt-1">{errors.budget_total.message}</p>}
              </div>
              <div>
                <label className="text-xs text-sigp-muted mb-1 block">Description</label>
                <textarea {...register('description')} rows={2} className="sigp-input resize-none" />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-ghost">Annuler</button>
                <button type="submit" disabled={isSubmitting} className="btn-primary flex items-center gap-2">
                  {isSubmitting && <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                  Créer le projet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal Export ───────────────────────────────────────────── */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-navy-800 border border-navy-500 rounded-xl w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-navy-500">
              <div className="flex items-center gap-2">
                <Download size={16} className="text-sigp-blue" />
                <h3 className="text-sm font-semibold text-sigp-text">Exporter les projets</h3>
              </div>
              <button onClick={() => setShowExportModal(false)} className="text-sigp-muted hover:text-sigp-text"><X size={16} /></button>
            </div>

            <div className="p-5 space-y-5">
              {/* Scope */}
              <div>
                <label className="text-xs font-bold text-sigp-muted uppercase tracking-wider block mb-2">Que souhaitez-vous exporter ?</label>
                <div className="space-y-1.5">
                  {[
                    { id: 'current', label: 'Vue actuelle avec filtres appliqués', count: projets.length },
                    { id: 'all', label: 'Tous les projets', count: allProjets.length },
                    { id: 'selected', label: 'Projets sélectionnés uniquement', count: selectedIds.size, disabled: selectedIds.size === 0 },
                  ].map(opt => (
                    <label key={opt.id} className={`flex items-center gap-3 p-2.5 rounded-lg border cursor-pointer transition-colors ${exportOptions.scope === opt.id ? 'border-sigp-blue bg-sigp-blue/10' : 'border-navy-500 hover:border-navy-400'} ${opt.disabled ? 'opacity-40 cursor-not-allowed' : ''}`}>
                      <input type="radio" name="scope" value={opt.id} checked={exportOptions.scope === opt.id} onChange={() => !opt.disabled && setExportOptions(s => ({ ...s, scope: opt.id as ExportScope }))} disabled={opt.disabled} className="accent-sigp-blue" />
                      <span className="text-xs text-sigp-text flex-1">{opt.label}</span>
                      <span className="text-[10px] text-sigp-muted bg-navy-700 px-2 py-0.5 rounded-full">{opt.count}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Report type */}
              <div>
                <label className="text-xs font-bold text-sigp-muted uppercase tracking-wider block mb-2">Type de rapport</label>
                <div className="flex gap-2">
                  {[
                    { id: 'list', label: 'Liste standard', icon: FileText },
                    { id: 'financial', label: 'Rapport financier', icon: FileSpreadsheet },
                  ].map(t => (
                    <button key={t.id} onClick={() => setExportOptions(s => ({ ...s, reportType: t.id as 'list' | 'financial' }))}
                      className={`flex-1 flex items-center gap-2 p-2.5 rounded-lg border text-xs font-semibold transition-colors ${exportOptions.reportType === t.id ? 'border-sigp-blue bg-sigp-blue/10 text-sigp-blue' : 'border-navy-500 text-sigp-muted hover:border-navy-400'}`}>
                      <t.icon size={13} /> {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Format */}
              <div>
                <label className="text-xs font-bold text-sigp-muted uppercase tracking-wider block mb-2">Format du fichier</label>
                <div className="flex gap-2">
                  {[
                    { id: 'xlsx', label: 'Excel (.xlsx)', icon: FileSpreadsheet, color: 'text-emerald-400' },
                    { id: 'csv', label: 'CSV', icon: File, color: 'text-sigp-muted' },
                    { id: 'print', label: 'PDF (impression)', icon: FileText, color: 'text-red-400' },
                  ].map(f => (
                    <button key={f.id} onClick={() => setExportOptions(s => ({ ...s, format: f.id as ExportFormat }))}
                      className={`flex-1 flex flex-col items-center gap-1 p-2.5 rounded-lg border text-xs font-semibold transition-colors ${exportOptions.format === f.id ? 'border-sigp-blue bg-sigp-blue/10 text-sigp-blue' : 'border-navy-500 text-sigp-muted hover:border-navy-400'}`}>
                      <f.icon size={16} className={exportOptions.format === f.id ? 'text-sigp-blue' : f.color} />
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Data to include (only for list mode) */}
              {exportOptions.reportType === 'list' && (
                <div>
                  <label className="text-xs font-bold text-sigp-muted uppercase tracking-wider block mb-2">Données à inclure</label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {[
                      { key: 'includeInfos', label: 'Informations générales' },
                      { key: 'includeBudget', label: 'Budget' },
                      { key: 'includeTasks', label: 'Tâches' },
                      { key: 'includeStatus', label: 'Statut' },
                    ].map(item => (
                      <label key={item.key} className="flex items-center gap-2 text-xs text-sigp-text cursor-pointer">
                        <input type="checkbox" checked={exportOptions[item.key as keyof ExportOptions] as boolean} onChange={e => setExportOptions(s => ({ ...s, [item.key]: e.target.checked }))} className="accent-sigp-blue" />
                        {item.label}
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Filename */}
              <div>
                <label className="text-xs font-bold text-sigp-muted uppercase tracking-wider block mb-2">Nom du fichier</label>
                <input
                  value={exportOptions.filename}
                  onChange={e => setExportOptions(s => ({ ...s, filename: e.target.value }))}
                  className="sigp-input text-xs"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 px-5 py-4 border-t border-navy-500">
              <button onClick={() => setShowExportModal(false)} className="btn-ghost text-xs">Annuler</button>
              <button onClick={doExport} className="btn-primary flex items-center gap-2 text-xs">
                <Download size={13} /> Exporter
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
