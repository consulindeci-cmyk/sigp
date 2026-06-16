import { useState, useRef, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import {
  Plus, Loader2, Search, Download, ChevronDown, X, MoreHorizontal,
  AlertTriangle, ShieldAlert, CheckCircle2, Clock, TrendingUp, Filter,
  FileSpreadsheet, File, FileText, RotateCcw, Check, Eye, Pencil, Copy, Trash2
} from 'lucide-react'
import * as XLSX from 'xlsx'
import { PageHeader } from '@/components/layout/AppShell'
import { useRisks, useCreateRisk, useUpdateRisk, useDeleteRisk } from '@/hooks/useRisks'
import { useProject } from '@/hooks/useProjects'
import type { Risque } from '@/types'

// ── Constants ────────────────────────────────────────────────────
const CATEGORIES = ['FINANCIER', 'TECHNIQUE', 'OPERATIONNEL', 'STRATEGIQUE', 'ENVIRONNEMENTAL']
const today = new Date().toISOString().slice(0, 10).replace(/-/g, '_')

// ── Helpers ──────────────────────────────────────────────────────
const getCriticiteScore = (p: number, i: number) => p * i

const getCriticiteConfig = (c: number) => {
  if (c <= 2) return { criticiteLabel: 'Faible', bg: 'bg-emerald-500/20', text: 'text-emerald-400', border: 'border-emerald-500/30' }
  if (c <= 4) return { criticiteLabel: 'Modéré', bg: 'bg-amber-500/20', text: 'text-amber-400', border: 'border-amber-500/30' }
  if (c === 6) return { criticiteLabel: 'Élevé', bg: 'bg-orange-500/20', text: 'text-orange-400', border: 'border-orange-500/30' }
  return { criticiteLabel: 'Critique', bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/30' }
}

const getStatutConfig = (statut: string) => {
  switch (statut) {
    case 'IDENTIFIE': return { label: 'Identifié', bg: 'bg-blue-500/20', text: 'text-blue-400' }
    case 'EN_COURS_ATTENUATION': return { label: 'En cours', bg: 'bg-orange-500/20', text: 'text-orange-400' }
    case 'RESIDU': return { label: 'Résidu', bg: 'bg-purple-500/20', text: 'text-purple-400' }
    case 'CLOS': return { label: 'Clos', bg: 'bg-emerald-500/20', text: 'text-emerald-400' }
    default: return { label: statut, bg: 'bg-navy-700', text: 'text-sigp-muted' }
  }
}

const getNiveauCriticite = (c: number): 'FAIBLE' | 'MODERE' | 'ELEVE' | 'CRITIQUE' => {
  if (c <= 2) return 'FAIBLE'
  if (c <= 4) return 'MODERE'
  if (c === 6) return 'ELEVE'
  return 'CRITIQUE'
}

const formatMontant = (n?: number | string | null) => {
  if (!n) return '—'
  return Number(n).toLocaleString('fr-FR') + ' FCFA'
}

// ── Mini P×I Matrix ──────────────────────────────────────────────
function RiskMatrix({ risks }: { risks: Risque[] }) {
  const countAt = (p: number, i: number) =>
    risks.filter(r => r.probabilite === p && r.impact === i).length

  return (
    <div className="bg-navy-800 border border-navy-500 rounded-xl p-4">
      <h3 className="text-xs font-bold text-sigp-muted uppercase tracking-wider mb-4 flex items-center gap-2">
        <TrendingUp size={13} /> Matrice P × I
      </h3>
      <div className="flex gap-4 items-start">
        {/* Matrix grid */}
        <div>
          <div className="flex items-center gap-1 mb-1">
            <div className="w-8" />
            {[1, 2, 3].map(i => (
              <div key={i} className="w-12 text-center text-[10px] text-sigp-muted font-semibold">I={i}</div>
            ))}
          </div>
          {[3, 2, 1].map(p => (
            <div key={p} className="flex items-center gap-1 mb-1">
              <div className="w-8 text-[10px] text-sigp-muted font-semibold text-right pr-1">P={p}</div>
              {[1, 2, 3].map(i => {
                const score = p * i
                const cfg = getCriticiteConfig(score)
                const count = countAt(p, i)
                return (
                  <div key={i} className={`w-12 h-10 rounded-lg flex flex-col items-center justify-center border ${cfg.bg} ${cfg.border} cursor-default`}>
                    <span className={`text-xs font-bold ${cfg.text}`}>{score}</span>
                    {count > 0 && (
                      <span className={`text-[9px] font-bold ${cfg.text} opacity-80`}>{count}×</span>
                    )}
                  </div>
                )
              })}
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="ml-2 flex flex-col gap-1.5 pt-6">
          {[
            { label: 'Faible (1–2)', ...getCriticiteConfig(1) },
            { label: 'Modéré (3–4)', ...getCriticiteConfig(3) },
            { label: 'Élevé (6)', ...getCriticiteConfig(6) },
            { label: 'Critique (9)', ...getCriticiteConfig(9) },
          ].map(l => (
            <div key={l.label} className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-sm ${l.bg} border ${l.border}`} />
              <span className={`text-[10px] ${l.text}`}>{l.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── KPI Card ─────────────────────────────────────────────────────
function KpiCard({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color?: string }) {
  return (
    <div className="bg-navy-800 border border-navy-500 rounded-xl p-4 flex flex-col gap-1">
      <span className="text-[10px] font-bold text-sigp-muted uppercase tracking-wider">{label}</span>
      <span className={`text-2xl font-bold ${color ?? 'text-sigp-text'}`}>{value}</span>
      {sub && <span className="text-[10px] text-sigp-muted">{sub}</span>}
    </div>
  )
}

// ── Export Scope & Format types ──────────────────────────────────
type ExportScope = 'current' | 'all' | 'selected'
type ExportFormat = 'xlsx' | 'csv' | 'print'
type ReportType = 'register' | 'critical' | 'mitigation' | 'financial'

interface ExportOpts {
  scope: ExportScope
  format: ExportFormat
  reportType: ReportType
  filename: string
}

interface ExportScopeOption {
  id: ExportScope
  label: string
  count: number
  disabled?: boolean
}

// ── Main Page ────────────────────────────────────────────────────
export default function RisksPage() {
  const { id: projectId = '' } = useParams()
  const { data: project } = useProject(projectId)
  const { data: risksData, isLoading } = useRisks(projectId)
  const createMutation = useCreateRisk(projectId)
  const updateMutation = useUpdateRisk(projectId)
  const deleteMutation = useDeleteRisk(projectId)

  // UI State
  const [search, setSearch] = useState('')
  const [filterCategorie, setFilterCategorie] = useState('')
  const [filterStatut, setFilterStatut] = useState('')
  const [filterCriticite, setFilterCriticite] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editRisk, setEditRisk] = useState<Risque | null>(null)
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [showExportMenu, setShowExportMenu] = useState(false)
  const [showExportModal, setShowExportModal] = useState(false)
  const exportMenuRef = useRef<HTMLDivElement>(null)
  const [exportOpts, setExportOpts] = useState<ExportOpts>({
    scope: 'current', format: 'xlsx', reportType: 'register',
    filename: `risques_${today}.xlsx`
  })

  const [formData, setFormData] = useState<Partial<Risque>>({
    categorie: 'FINANCIER', description: '', probabilite: 1,
    impact: 1, plan_mitigation: '', statut: 'IDENTIFIE'
  })

  const risques: Risque[] = (risksData?.data ?? []) as Risque[]

  // ── Filtered view ───────────────────────────────────────────────
  const filtered = risques.filter(r => {
    const score = getCriticiteScore(r.probabilite, r.impact)
    const cfg = getCriticiteConfig(score)
    if (search && !r.description.toLowerCase().includes(search.toLowerCase()) && !r.categorie.toLowerCase().includes(search.toLowerCase())) return false
    if (filterCategorie && r.categorie !== filterCategorie) return false
    if (filterStatut && r.statut !== filterStatut) return false
    if (filterCriticite && cfg.criticiteLabel !== filterCriticite) return false
    return true
  })

  const hasFilters = !!(search || filterCategorie || filterStatut || filterCriticite)
  const resetFilters = () => { setSearch(''); setFilterCategorie(''); setFilterStatut(''); setFilterCriticite('') }

  // ── KPIs ────────────────────────────────────────────────────────
  const critiques = risques.filter(r => getCriticiteScore(r.probabilite, r.impact) === 9)
  const enCours = risques.filter(r => r.statut === 'EN_COURS_ATTENUATION')
  const clos = risques.filter(r => r.statut === 'CLOS')
  const expositionFinanciere = risques.filter(r => r.statut !== 'CLOS')
    .reduce((sum, r) => sum + (Number((r as any).cout_estime) || 0), 0)

  // ── Selection ────────────────────────────────────────────────────
  const toggleSelect = (id: string) => setSelectedIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  const toggleSelectAll = () => setSelectedIds(selectedIds.size === filtered.length ? new Set() : new Set(filtered.map(r => r.id)))

  // ── Close menus on outside click ────────────────────────────────
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target as Node)) setShowExportMenu(false)
      setOpenMenuId(null)
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  // ── Update filename when format changes ─────────────────────────
  useEffect(() => {
    const ext = exportOpts.format === 'xlsx' ? 'xlsx' : exportOpts.format === 'csv' ? 'csv' : 'pdf'
    setExportOpts(s => ({ ...s, filename: `risques_${today}.${ext}` }))
  }, [exportOpts.format])

  // ── Form handlers ────────────────────────────────────────────────
  const openCreate = () => {
    setEditRisk(null)
    setFormData({ categorie: 'FINANCIER', description: '', probabilite: 1, impact: 1, plan_mitigation: '', statut: 'IDENTIFIE' })
    setShowModal(true)
  }

  const openEdit = (r: Risque) => {
    setEditRisk(r)
    setFormData({ ...r })
    setShowModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const p = Number(formData.probabilite) || 1
    const i = Number(formData.impact) || 1
    const criticite = getCriticiteScore(p, i)
    const payload = { ...formData, probabilite: p, impact: i, criticite, niveau_criticite: getNiveauCriticite(criticite) }

    if (editRisk) {
      await updateMutation.mutateAsync({ id: editRisk.id, ...payload })
    } else {
      await createMutation.mutateAsync(payload)
    }
    setShowModal(false)
  }

  const handleDuplicate = async (r: Risque) => {
    const p = r.probabilite; const i = r.impact; const c = p * i
    await createMutation.mutateAsync({
      ...r, id: undefined, code_risque: undefined, createdAt: undefined,
      description: `[Copie] ${r.description}`, probabilite: p, impact: i,
      criticite: c, niveau_criticite: getNiveauCriticite(c)
    } as Partial<Risque>)
  }

  // ── Export ───────────────────────────────────────────────────────
  const getExportData = () => {
    if (exportOpts.scope === 'selected') return risques.filter(r => selectedIds.has(r.id))
    if (exportOpts.scope === 'all') return risques
    return filtered
  }

  const buildRows = (data: Risque[]) => {
    const rows = exportOpts.reportType === 'critical' ? data.filter(r => r.criticite >= 6) : data
    return rows.map(r => {
      const score = r.criticite || getCriticiteScore(r.probabilite, r.impact)
      const base: Record<string, string | number> = {
        'Code Risque': r.code_risque || '—',
        'Catégorie': r.categorie,
        'Description': r.description,
        'Probabilité': r.probabilite,
        'Impact': r.impact,
        'Criticité': score,
        'Niveau': getCriticiteConfig(score).criticiteLabel,
        'Statut': getStatutConfig(r.statut).label,
      }
      if (exportOpts.reportType === 'mitigation' || exportOpts.reportType === 'register') {
        base['Plan de mitigation'] = r.plan_mitigation || '—'
      }
      if (exportOpts.reportType === 'financial' || exportOpts.reportType === 'register') {
        base['Coût estimé (FCFA)'] = Number((r as any).cout_estime) || 0
      }
      base['Date création'] = new Date(r.createdAt).toLocaleDateString('fr-FR')
      return base
    })
  }

  const doExport = () => {
    const rows = buildRows(getExportData())
    if (rows.length === 0) { setShowExportModal(false); return }

    if (exportOpts.format === 'csv') {
      const headers = Object.keys(rows[0])
      const csv = [headers.join(';'), ...rows.map(r => headers.map(h => `"${r[h] ?? ''}"`).join(';'))].join('\n')
      const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a'); a.href = url; a.download = exportOpts.filename; a.click()
      URL.revokeObjectURL(url)
    } else if (exportOpts.format === 'xlsx') {
      const ws = XLSX.utils.json_to_sheet(rows)
      // Right-align numeric columns
      ws['!cols'] = Object.keys(rows[0]).map(() => ({ wch: 20 }))
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Risques')
      XLSX.writeFile(wb, exportOpts.filename)
    } else {
      const data = getExportData()
      const html = `<!DOCTYPE html><html><head><title>Registre des risques</title>
        <style>body{font-family:Arial;font-size:11px;margin:20px}h1{font-size:15px}
        p{font-size:10px;color:#666;margin-bottom:16px}
        table{width:100%;border-collapse:collapse}th,td{border:1px solid #ccc;padding:5px 7px;text-align:left}
        th{background:#1a2340;color:#fff;font-size:9px;text-transform:uppercase}
        tr:nth-child(even){background:#f5f7fa}
        .FAIBLE{background:#d1fae5;color:#065f46}.MODERE{background:#fef3c7;color:#92400e}
        .ELEVE{background:#ffedd5;color:#9a3412}.CRITIQUE{background:#fee2e2;color:#991b1b}
        @media print{body{margin:0}}</style></head><body>
        <h1>Registre des Risques — ${project?.nom_projet ?? ''}</h1>
        <p>Projet : ${project?.code_projet ?? ''} | Export le ${new Date().toLocaleDateString('fr-FR')} | ${data.length} risque(s)</p>
        <table><thead><tr>
          <th>Code</th><th>Catégorie</th><th>Description</th><th>P</th><th>I</th>
          <th>Score</th><th>Niveau</th><th>Mitigation</th><th>Statut</th>
        </tr></thead><tbody>
        ${data.map(r => {
          const score = r.criticite || r.probabilite * r.impact
          const cfg = getCriticiteConfig(score)
          return `<tr>
            <td>${r.code_risque || '—'}</td><td>${r.categorie}</td>
            <td>${r.description}</td><td>${r.probabilite}</td><td>${r.impact}</td>
            <td style="text-align:center;font-weight:bold">${score}</td>
            <td><span class="${cfg.criticiteLabel.toUpperCase().replace('É','E').replace('É','E')}">${cfg.criticiteLabel}</span></td>
            <td>${r.plan_mitigation || '—'}</td>
            <td>${getStatutConfig(r.statut).label}</td>
          </tr>`
        }).join('')}
        </tbody></table></body></html>`
      const w = window.open('', '_blank')
      if (w) { w.document.write(html); w.document.close(); w.print() }
    }
    setShowExportModal(false)
  }

  const openExport = (scope: ExportScope = 'current') => {
    setExportOpts(s => ({ ...s, scope }))
    setShowExportMenu(false)
    setShowExportModal(true)
  }

  const formCriticite = getCriticiteScore(Number(formData.probabilite) || 1, Number(formData.impact) || 1)

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title={`Risques — ${project?.code_projet ?? '…'}`}
        subtitle="Registre et suivi des risques du projet"
        actions={
          <div className="flex items-center gap-2">
            {/* Export */}
            <div className="relative" ref={exportMenuRef}>
              <button
                onClick={() => risques.length > 0 && setShowExportMenu(v => !v)}
                disabled={risques.length === 0}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border border-navy-500 text-sigp-muted hover:text-sigp-text hover:border-sigp-blue rounded-lg transition-all disabled:opacity-40"
              >
                <Download size={13} /> Exporter <ChevronDown size={11} className={`transition-transform ${showExportMenu ? 'rotate-180' : ''}`} />
              </button>
              {showExportMenu && (
                <div className="absolute right-0 top-full mt-1 w-56 bg-navy-800 border border-navy-500 rounded-xl shadow-2xl z-30 py-1">
                  <div className="px-3 py-1.5 text-[10px] font-bold text-sigp-muted uppercase tracking-wider border-b border-navy-500">Périmètre</div>
                  <button onClick={() => openExport('current')} className="w-full text-left flex items-center gap-2 px-4 py-2 text-xs text-sigp-text hover:bg-navy-700"><Filter size={11} className="text-sigp-blue" /> Vue actuelle (filtres actifs)</button>
                  <button onClick={() => openExport('all')} className="w-full text-left flex items-center gap-2 px-4 py-2 text-xs text-sigp-text hover:bg-navy-700"><FileText size={11} /> Tous les risques</button>
                  <button onClick={() => openExport('selected')} disabled={selectedIds.size === 0} className="w-full text-left flex items-center gap-2 px-4 py-2 text-xs text-sigp-text hover:bg-navy-700 disabled:opacity-40"><Check size={11} /> Sélection ({selectedIds.size})</button>
                  <div className="px-3 py-1.5 text-[10px] font-bold text-sigp-muted uppercase tracking-wider border-t border-b border-navy-500 mt-1">Rapports</div>
                  <button onClick={() => { setExportOpts(s => ({...s, scope: 'all', reportType: 'critical'})); setShowExportMenu(false); setShowExportModal(true) }} className="w-full text-left flex items-center gap-2 px-4 py-2 text-xs text-sigp-text hover:bg-navy-700"><AlertTriangle size={11} className="text-red-400" /> Risques critiques</button>
                  <button onClick={() => { setExportOpts(s => ({...s, scope: 'all', reportType: 'mitigation'})); setShowExportMenu(false); setShowExportModal(true) }} className="w-full text-left flex items-center gap-2 px-4 py-2 text-xs text-sigp-text hover:bg-navy-700"><ShieldAlert size={11} className="text-orange-400" /> Plan de mitigation</button>
                  <button onClick={() => { setExportOpts(s => ({...s, scope: 'all', reportType: 'financial'})); setShowExportMenu(false); setShowExportModal(true) }} className="w-full text-left flex items-center gap-2 px-4 py-2 text-xs text-sigp-text hover:bg-navy-700"><FileSpreadsheet size={11} className="text-emerald-400" /> Rapport financier</button>
                </div>
              )}
            </div>
            <button onClick={openCreate} className="btn-primary flex items-center gap-1.5 text-xs">
              <Plus size={13} /> Ajouter un risque
            </button>
          </div>
        }
      />

      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="animate-spin text-sigp-muted" /></div>
      ) : (
        <div className="flex-1 overflow-y-auto p-4 space-y-4">

          {/* ── KPIs ─────────────────────────────────────────────── */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <KpiCard label="Total risques" value={risques.length} />
            <KpiCard label="Risques critiques" value={critiques.length} color={critiques.length > 0 ? 'text-red-400' : 'text-sigp-text'} sub="Score = 9" />
            <KpiCard label="En cours" value={enCours.length} color="text-orange-400" sub="Atténuation active" />
            <KpiCard label="Clos" value={clos.length} color="text-emerald-400" />
            <KpiCard label="Exposition financière" value={expositionFinanciere > 0 ? formatMontant(expositionFinanciere) : '—'} color="text-amber-400" sub="Risques actifs" />
          </div>

          {/* ── Matrix + Filters ────────────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-[auto,1fr] gap-4 items-start">
            <RiskMatrix risks={risques} />

            {/* Filters */}
            <div className="bg-navy-800 border border-navy-500 rounded-xl p-4 space-y-3">
              <h3 className="text-xs font-bold text-sigp-muted uppercase tracking-wider flex items-center gap-2"><Filter size={12} /> Filtres</h3>
              <div className="relative">
                <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-sigp-muted" />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher un risque..." className="sigp-input pl-8 py-1.5 text-xs w-full" />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <select value={filterCategorie} onChange={e => setFilterCategorie(e.target.value)} className="sigp-input py-1.5 text-xs">
                  <option value="">Toutes catégories</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <select value={filterStatut} onChange={e => setFilterStatut(e.target.value)} className="sigp-input py-1.5 text-xs">
                  <option value="">Tous statuts</option>
                  <option value="IDENTIFIE">Identifié</option>
                  <option value="EN_COURS_ATTENUATION">En cours</option>
                  <option value="RESIDU">Résidu</option>
                  <option value="CLOS">Clos</option>
                </select>
                <select value={filterCriticite} onChange={e => setFilterCriticite(e.target.value)} className="sigp-input py-1.5 text-xs">
                  <option value="">Toute criticité</option>
                  <option value="Faible">Faible (1–2)</option>
                  <option value="Modéré">Modéré (3–4)</option>
                  <option value="Élevé">Élevé (6)</option>
                  <option value="Critique">Critique (9)</option>
                </select>
              </div>
              {hasFilters && (
                <button onClick={resetFilters} className="flex items-center gap-1.5 text-xs text-sigp-muted hover:text-sigp-text border border-navy-500 px-2.5 py-1.5 rounded-lg transition-colors">
                  <RotateCcw size={10} /> Réinitialiser les filtres
                </button>
              )}
            </div>
          </div>

          {/* ── Selection bar ───────────────────────────────────── */}
          {selectedIds.size > 0 && (
            <div className="flex items-center justify-between px-4 py-2.5 bg-sigp-blue/10 border border-sigp-blue/30 rounded-xl text-sm">
              <span className="text-sigp-blue font-semibold flex items-center gap-2"><Check size={14} /> {selectedIds.size} risque(s) sélectionné(s)</span>
              <div className="flex gap-2">
                <button onClick={() => openExport('selected')} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-sigp-blue text-white rounded-lg hover:bg-sigp-blue-light transition-colors"><Download size={11} /> Exporter la sélection</button>
                <button onClick={() => setSelectedIds(new Set())} className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-sigp-muted hover:text-sigp-text border border-navy-500 rounded-lg transition-colors"><X size={11} /> Annuler</button>
              </div>
            </div>
          )}

          {/* ── Table ───────────────────────────────────────────── */}
          <div className="bg-navy-800 border border-navy-500 rounded-xl overflow-hidden">
            {filtered.length === 0 ? (
              <div className="py-12 text-center text-sigp-muted space-y-3">
                {hasFilters ? (
                  <>
                    <AlertTriangle size={28} className="mx-auto text-sigp-muted/40" />
                    <p className="text-sm">Aucun risque ne correspond à ces filtres.</p>
                    <button onClick={resetFilters} className="text-xs text-sigp-blue hover:underline">Réinitialiser les filtres</button>
                  </>
                ) : (
                  <>
                    <ShieldAlert size={28} className="mx-auto text-sigp-muted/40" />
                    <p className="text-sm">Aucun risque identifié pour ce projet.</p>
                    <button onClick={openCreate} className="text-xs text-sigp-blue hover:underline">Déclarer le premier risque</button>
                  </>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="excel-table min-w-[1100px]">
                  <thead>
                    <tr>
                      <th className="w-8">
                        <input type="checkbox" checked={filtered.length > 0 && selectedIds.size === filtered.length} onChange={toggleSelectAll} className="accent-sigp-blue cursor-pointer" />
                      </th>
                      <th>Catégorie</th>
                      <th className="w-1/5">Description</th>
                      <th className="text-center">P</th>
                      <th className="text-center">I</th>
                      <th className="text-center">Criticité</th>
                      <th>Responsable</th>
                      <th className="text-right">Coût estimé</th>
                      <th className="w-1/5">Mitigation</th>
                      <th>Statut</th>
                      <th className="w-20 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(r => {
                      const score = r.criticite || getCriticiteScore(r.probabilite, r.impact)
                      const cfg = getCriticiteConfig(score)
                      const stt = getStatutConfig(r.statut)
                      return (
                        <tr key={r.id} className={selectedIds.has(r.id) ? 'bg-sigp-blue/5' : ''}>
                          <td><input type="checkbox" checked={selectedIds.has(r.id)} onChange={() => toggleSelect(r.id)} className="accent-sigp-blue cursor-pointer" /></td>
                          <td>
                            <span className="text-[10px] font-bold text-sigp-muted bg-navy-700 px-2 py-0.5 rounded">{r.categorie}</span>
                          </td>
                          <td className="whitespace-normal text-xs text-sigp-text leading-relaxed max-w-[180px]">{r.description}</td>
                          <td className="text-center font-mono font-bold text-sigp-text">{r.probabilite}</td>
                          <td className="text-center font-mono font-bold text-sigp-text">{r.impact}</td>
                          <td className="text-center">
                            <span className={`inline-flex items-center justify-center w-8 h-8 rounded-lg font-bold text-sm ${cfg.bg} ${cfg.text} border ${cfg.border}`}>{score}</span>
                            <div className={`text-[9px] font-semibold mt-0.5 ${cfg.text}`}>{cfg.criticiteLabel}</div>
                          </td>
                          <td className="text-xs text-sigp-muted">{(r as any).responsable || '—'}</td>
                          <td className="text-right font-mono text-xs">{formatMontant((r as any).cout_estime)}</td>
                          <td className="whitespace-normal text-[11px] text-sigp-muted max-w-[180px] leading-relaxed">{r.plan_mitigation || '—'}</td>
                          <td>
                            <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${stt.bg} ${stt.text}`}>{stt.label}</span>
                          </td>
                          <td className="text-center relative">
                            <button onClick={() => setOpenMenuId(openMenuId === r.id ? null : r.id)} className="text-sigp-muted hover:text-sigp-text p-1 rounded hover:bg-navy-700 transition-colors">
                              <MoreHorizontal size={14} />
                            </button>
                            {openMenuId === r.id && (
                              <div className="absolute right-2 top-8 w-36 bg-navy-800 border border-navy-500 rounded-xl shadow-2xl z-20 py-1 text-left">
                                <button onClick={() => { openEdit(r); setOpenMenuId(null) }} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-sigp-text hover:bg-navy-700"><Eye size={11} /> Voir / Modifier</button>
                                <button onClick={() => { openEdit(r); setOpenMenuId(null) }} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-sigp-text hover:bg-navy-700"><Pencil size={11} /> Modifier</button>
                                <button onClick={() => { handleDuplicate(r); setOpenMenuId(null) }} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-sigp-text hover:bg-navy-700"><Copy size={11} /> Dupliquer</button>
                                <div className="border-t border-navy-500 my-1" />
                                <button onClick={() => { deleteMutation.mutate(r.id); setOpenMenuId(null) }} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-400 hover:bg-red-500/10"><Trash2 size={11} /> Supprimer</button>
                              </div>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Footer info */}
          {filtered.length > 0 && (
            <div className="text-xs text-sigp-muted text-right">
              {filtered.length} risque(s) affiché(s) sur {risques.length} au total
            </div>
          )}
        </div>
      )}

      {/* ── Modal Création / Modification ─────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-navy-800 border border-navy-500 rounded-xl w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-navy-500">
              <h3 className="text-sm font-semibold text-sigp-text">{editRisk ? 'Modifier le risque' : 'Déclarer un nouveau risque'}</h3>
              <button onClick={() => setShowModal(false)} className="text-sigp-muted hover:text-sigp-text"><X size={16} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-sigp-muted mb-1 block">Catégorie</label>
                  <select value={formData.categorie} onChange={e => setFormData({ ...formData, categorie: e.target.value })} className="sigp-input">
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-sigp-muted mb-1 block">Statut</label>
                  <select value={formData.statut} onChange={e => setFormData({ ...formData, statut: e.target.value })} className="sigp-input">
                    <option value="IDENTIFIE">Identifié</option>
                    <option value="EN_COURS_ATTENUATION">En cours d'atténuation</option>
                    <option value="RESIDU">Résidu</option>
                    <option value="CLOS">Clos</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs text-sigp-muted mb-1 block">Description *</label>
                <textarea required rows={2} value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className="sigp-input resize-none" placeholder="Description du risque..." />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-sigp-muted mb-1 block">Probabilité (1–3)</label>
                  <select value={formData.probabilite} onChange={e => setFormData({ ...formData, probabilite: Number(e.target.value) })} className="sigp-input">
                    <option value={1}>1 — Faible</option>
                    <option value={2}>2 — Moyen</option>
                    <option value={3}>3 — Fort</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-sigp-muted mb-1 block">Impact (1–3)</label>
                  <select value={formData.impact} onChange={e => setFormData({ ...formData, impact: Number(e.target.value) })} className="sigp-input">
                    <option value={1}>1 — Mineur</option>
                    <option value={2}>2 — Modéré</option>
                    <option value={3}>3 — Majeur</option>
                  </select>
                </div>
              </div>

              {/* Live criticité preview */}
              <div className={`p-3 rounded-xl border flex items-center justify-between ${getCriticiteConfig(formCriticite).bg} ${getCriticiteConfig(formCriticite).border}`}>
                <span className="text-xs text-sigp-muted">Criticité calculée (P × I) :</span>
                <div className="flex items-center gap-3">
                  <span className={`text-2xl font-bold ${getCriticiteConfig(formCriticite).text}`}>{formCriticite}</span>
                  <span className={`text-xs font-bold px-2 py-1 rounded-full ${getCriticiteConfig(formCriticite).bg} ${getCriticiteConfig(formCriticite).text}`}>
                    {getCriticiteConfig(formCriticite).criticiteLabel}
                  </span>
                </div>
              </div>

              <div>
                <label className="text-xs text-sigp-muted mb-1 block">Plan de mitigation</label>
                <textarea rows={2} value={formData.plan_mitigation || ''} onChange={e => setFormData({ ...formData, plan_mitigation: e.target.value })} className="sigp-input resize-none" placeholder="Actions prévues pour réduire ce risque..." />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-ghost">Annuler</button>
                <button type="submit" disabled={createMutation.isPending || updateMutation.isPending} className="btn-primary flex items-center gap-2">
                  {(createMutation.isPending || updateMutation.isPending) && <Loader2 size={14} className="animate-spin" />}
                  {editRisk ? 'Enregistrer' : 'Ajouter'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal Export ─────────────────────────────────────────── */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-navy-800 border border-navy-500 rounded-xl w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-navy-500">
              <div className="flex items-center gap-2"><Download size={15} className="text-sigp-blue" /><h3 className="text-sm font-semibold text-sigp-text">Exporter les risques</h3></div>
              <button onClick={() => setShowExportModal(false)} className="text-sigp-muted hover:text-sigp-text"><X size={16} /></button>
            </div>
            <div className="p-5 space-y-5">
              {/* Scope */}
              <div>
                <label className="text-xs font-bold text-sigp-muted uppercase tracking-wider block mb-2">Périmètre</label>
                <div className="space-y-1.5">
                  {([
                    { id: 'current' as ExportScope, label: 'Vue actuelle (filtres actifs)', count: filtered.length },
                    { id: 'all' as ExportScope, label: 'Tous les risques', count: risques.length },
                    { id: 'selected' as ExportScope, label: 'Sélection', count: selectedIds.size, disabled: selectedIds.size === 0 },
                  ] as ExportScopeOption[]).map(opt => (
                    <label key={opt.id} className={`flex items-center gap-3 p-2.5 rounded-lg border cursor-pointer transition-colors ${exportOpts.scope === opt.id ? 'border-sigp-blue bg-sigp-blue/10' : 'border-navy-500 hover:border-navy-400'} ${opt.disabled ? 'opacity-40 cursor-not-allowed' : ''}`}>
                      <input type="radio" checked={exportOpts.scope === opt.id} onChange={() => !opt.disabled && setExportOpts(s => ({ ...s, scope: opt.id }))} disabled={opt.disabled} className="accent-sigp-blue" />
                      <span className="text-xs text-sigp-text flex-1">{opt.label}</span>
                      <span className="text-[10px] text-sigp-muted bg-navy-700 px-2 py-0.5 rounded-full">{opt.count}</span>
                    </label>
                  ))}
                </div>
              </div>
              {/* Report type */}
              <div>
                <label className="text-xs font-bold text-sigp-muted uppercase tracking-wider block mb-2">Type de rapport</label>
                <div className="grid grid-cols-2 gap-2">
                  {([
                    { id: 'register', label: 'Registre complet', icon: FileText },
                    { id: 'critical', label: 'Risques critiques', icon: AlertTriangle },
                    { id: 'mitigation', label: 'Plan de mitigation', icon: ShieldAlert },
                    { id: 'financial', label: 'Rapport financier', icon: FileSpreadsheet },
                  ] as const).map(t => (
                    <button key={t.id} onClick={() => setExportOpts(s => ({ ...s, reportType: t.id }))}
                      className={`flex items-center gap-2 p-2.5 rounded-lg border text-xs font-semibold transition-colors ${exportOpts.reportType === t.id ? 'border-sigp-blue bg-sigp-blue/10 text-sigp-blue' : 'border-navy-500 text-sigp-muted hover:border-navy-400'}`}>
                      <t.icon size={12} /> {t.label}
                    </button>
                  ))}
                </div>
              </div>
              {/* Format */}
              <div>
                <label className="text-xs font-bold text-sigp-muted uppercase tracking-wider block mb-2">Format</label>
                <div className="flex gap-2">
                  {([
                    { id: 'xlsx', label: 'Excel (.xlsx)', icon: FileSpreadsheet },
                    { id: 'csv', label: 'CSV', icon: File },
                    { id: 'print', label: 'PDF (impression)', icon: FileText },
                  ] as const).map(f => (
                    <button key={f.id} onClick={() => setExportOpts(s => ({ ...s, format: f.id }))}
                      className={`flex-1 flex flex-col items-center gap-1 p-2.5 rounded-lg border text-xs font-semibold transition-colors ${exportOpts.format === f.id ? 'border-sigp-blue bg-sigp-blue/10 text-sigp-blue' : 'border-navy-500 text-sigp-muted hover:border-navy-400'}`}>
                      <f.icon size={14} /> {f.label}
                    </button>
                  ))}
                </div>
              </div>
              {/* Filename */}
              <div>
                <label className="text-xs font-bold text-sigp-muted uppercase tracking-wider block mb-2">Nom du fichier</label>
                <input value={exportOpts.filename} onChange={e => setExportOpts(s => ({ ...s, filename: e.target.value }))} className="sigp-input text-xs" />
              </div>
            </div>
            <div className="flex justify-end gap-2 px-5 py-4 border-t border-navy-500">
              <button onClick={() => setShowExportModal(false)} className="btn-ghost text-xs">Annuler</button>
              <button onClick={doExport} className="btn-primary flex items-center gap-2 text-xs"><Download size={13} /> Exporter</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
