import { useState, useRef, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import {
  Plus, Loader2, X, Download, ChevronDown, Search,
  MoreHorizontal, Pencil, Trash2, Copy, FileSpreadsheet, File, FileText,
  RotateCcw, Check, ShoppingCart, Clock, CheckCircle2, PauseCircle, PenTool
} from 'lucide-react'
import * as XLSX from 'xlsx'
import { PageHeader } from '@/components/layout/AppShell'
import { usePPM, useCreateMarche, useUpdateMarche, useDeleteMarche } from '@/hooks/usePPM'
import { useProject } from '@/hooks/useProjects'
import type { Marche } from '@/types'

const fmt = (n: number) => new Intl.NumberFormat('fr-FR').format(n)
const today = new Date().toISOString().slice(0, 10).replace(/-/g, '_')

const TYPES_MARCHE = ['TRAVAUX', 'FOURNITURES', 'SERVICES', 'CONSULTANTS']
const METHODES = ['AOI', 'AON', 'DEMANDE_COTATION', 'SFQC', 'SMC', 'GRE_A_GRE']
const STATUTS = ['PLANIFIE', 'EN_COURS', 'ADJUGE', 'SIGNE', 'RESILIE', 'ANNULE']

const getStatutBadge = (statut: string) => {
  switch (statut) {
    case 'PLANIFIE': return { label: 'Planifié', bg: 'bg-blue-500/20', text: 'text-blue-400', icon: Clock }
    case 'EN_COURS': return { label: 'En cours', bg: 'bg-amber-500/20', text: 'text-amber-400', icon: PenTool }
    case 'ADJUGE': return { label: 'Adjugé', bg: 'bg-emerald-500/20', text: 'text-emerald-400', icon: Check }
    case 'SIGNE': return { label: 'Signé', bg: 'bg-indigo-500/20', text: 'text-indigo-400', icon: CheckCircle2 }
    case 'RESILIE': return { label: 'Résilié', bg: 'bg-red-500/20', text: 'text-red-400', icon: X }
    case 'ANNULE': return { label: 'Annulé', bg: 'bg-gray-500/20', text: 'text-gray-400', icon: PauseCircle }
    default: return { label: statut, bg: 'bg-navy-700', text: 'text-sigp-muted', icon: Clock }
  }
}

export default function PPMPage() {
  const { id: projectId = '' } = useParams()
  const { data: project } = useProject(projectId)
  const { data: ppmData, isLoading } = usePPM(projectId)
  const createMutation = useCreateMarche(projectId)
  const updateMutation = useUpdateMarche(projectId)
  const deleteMutation = useDeleteMarche(projectId)

  const marches: Marche[] = (ppmData?.data ?? []) as Marche[]

  const [search, setSearch] = useState('')
  const [filterStatut, setFilterStatut] = useState('')
  const [filterType, setFilterType] = useState('')
  const [filterMethode, setFilterMethode] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editMarche, setEditMarche] = useState<Marche | null>(null)
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [showExportMenu, setShowExportMenu] = useState(false)
  const exportMenuRef = useRef<HTMLDivElement>(null)

  const [formData, setFormData] = useState<Partial<Marche>>({
    description_marche: '', type_marche: 'TRAVAUX', methode: 'AON', montant_estime: '', statut: 'PLANIFIE', date_prevue: ''
  })

  const filtered = marches.filter(m => {
    if (search && !m.description_marche?.toLowerCase().includes(search.toLowerCase())) return false
    if (filterStatut && m.statut !== filterStatut) return false
    if (filterType && m.type_marche !== filterType) return false
    if (filterMethode && m.methode !== filterMethode) return false
    return true
  })

  const hasFilters = !!(search || filterStatut || filterType || filterMethode)

  // KPIs
  const totalEstime = marches.reduce((s, m) => s + (Number(m.montant_estime) || 0), 0)
  const totalSigne = marches.filter(m => m.statut === 'SIGNE').reduce((s, m) => s + (Number(m.montant_estime) || 0), 0)
  const nbSignes = marches.filter(m => m.statut === 'SIGNE').length
  const nbEnCours = marches.filter(m => m.statut === 'EN_COURS' || m.statut === 'ADJUGE').length

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target as Node)) setShowExportMenu(false)
      setOpenMenuId(null)
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  const openCreate = () => {
    setEditMarche(null)
    setFormData({ description_marche: '', type_marche: 'TRAVAUX', methode: 'AON', montant_estime: '', statut: 'PLANIFIE', date_prevue: '' })
    setShowModal(true)
  }

  const openEdit = (m: Marche) => {
    setEditMarche(m)
    setFormData({ ...m, date_prevue: m.date_prevue ? new Date(m.date_prevue).toISOString().split('T')[0] : '' })
    setShowModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const payload = {
      ...formData,
      montant_estime: Number(formData.montant_estime) || 0,
      date_prevue: formData.date_prevue ? new Date(formData.date_prevue).toISOString() : undefined
    }
    if (editMarche) {
      await updateMutation.mutateAsync({ id: editMarche.id, ...payload })
    } else {
      await createMutation.mutateAsync(payload)
    }
    setShowModal(false)
  }

  const toggleSelect = (id: string) => setSelectedIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  const toggleSelectAll = () => setSelectedIds(selectedIds.size === filtered.length ? new Set() : new Set(filtered.map(m => m.id)))

  const doExport = (scope: 'current' | 'all' | 'selected', format: 'xlsx' | 'csv' | 'print') => {
    const data = scope === 'selected' ? marches.filter(m => selectedIds.has(m.id)) : scope === 'all' ? marches : filtered
    if (data.length === 0) return
    const rows = data.map(m => ({
      'Description': m.description_marche,
      'Type': m.type_marche,
      'Méthode': m.methode,
      [`Montant Estimé (${project?.devise})`]: Number(m.montant_estime) || 0,
      'Date Prévue': m.date_prevue ? new Date(m.date_prevue).toLocaleDateString('fr-FR') : '—',
      'Statut': getStatutBadge(m.statut).label,
    }))
    if (format === 'xlsx') {
      const ws = XLSX.utils.json_to_sheet(rows)
      ws['!cols'] = [{ wch: 40 }, { wch: 15 }, { wch: 15 }, { wch: 20 }, { wch: 15 }, { wch: 15 }]
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'PPM')
      XLSX.writeFile(wb, `ppm_${today}.xlsx`)
    } else if (format === 'csv') {
      const headers = Object.keys(rows[0])
      const csv = [headers.join(';'), ...rows.map(r => headers.map(h => `"${(r as any)[h] ?? ''}"`).join(';'))].join('\n')
      const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `ppm_${today}.csv`; a.click()
    } else {
      const html = `<!DOCTYPE html><html><head><title>PPM ${project?.code_projet}</title>
        <style>body{font-family:Arial;font-size:10px;margin:20px}h1{font-size:14px}p{font-size:10px;color:#666;margin-bottom:10px}
        table{width:100%;border-collapse:collapse}th,td{border:1px solid #ccc;padding:4px 6px}th{background:#1a2340;color:#fff;font-size:9px;text-transform:uppercase}
        tr:nth-child(even){background:#f5f7fa}.total{background:#1a2340;color:#fff}.num{text-align:right;font-family:monospace}@media print{body{margin:0}}</style></head><body>
        <h1>PPM — ${project?.nom_projet ?? ''}</h1>
        <p>Export le ${new Date().toLocaleDateString('fr-FR')} | ${data.length} marché(s) | Total estimé : ${fmt(totalEstime)} ${project?.devise}</p>
        <table><thead><tr><th>Description</th><th>Type</th><th>Méthode</th><th class="num">Montant Estimé (${project?.devise})</th><th class="num">Date Prévue</th><th>Statut</th></tr></thead>
        <tbody>${data.map(m => `<tr><td>${m.description_marche}</td><td>${m.type_marche}</td><td>${m.methode}</td><td class="num">${fmt(Number(m.montant_estime)||0)}</td><td class="num">${m.date_prevue ? new Date(m.date_prevue).toLocaleDateString('fr-FR') : '—'}</td><td>${getStatutBadge(m.statut).label}</td></tr>`).join('')}
        <tr class="total"><td colspan="3" class="num"><strong>TOTAL ESTIMÉ</strong></td><td class="num"><strong>${fmt(data.reduce((s,m) => s+(Number(m.montant_estime)||0), 0))}</strong></td><td colspan="2"></td></tr>
        </tbody></table></body></html>`
      const w = window.open('', '_blank'); if (w) { w.document.write(html); w.document.close(); w.print() }
    }
    setShowExportMenu(false)
  }

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title={`PPM — ${project?.code_projet ?? '…'}`}
        subtitle="Plan de Passation des Marchés"
        actions={
          <div className="flex items-center gap-2">
            <div className="relative" ref={exportMenuRef}>
              <button onClick={() => marches.length > 0 && setShowExportMenu(v => !v)} disabled={marches.length === 0}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border border-navy-500 text-sigp-muted hover:text-sigp-text hover:border-sigp-blue rounded-lg transition-all disabled:opacity-40">
                <Download size={13} /> Exporter <ChevronDown size={11} className={`transition-transform ${showExportMenu ? 'rotate-180' : ''}`} />
              </button>
              {showExportMenu && (
                <div className="absolute right-0 top-full mt-1 w-52 bg-navy-800 border border-navy-500 rounded-xl shadow-2xl z-30 py-1">
                  <button onClick={() => doExport('current', 'xlsx')} className="w-full text-left flex items-center gap-2 px-4 py-2 text-xs text-sigp-text hover:bg-navy-700"><FileSpreadsheet size={11} className="text-emerald-400" /> Excel — vue actuelle</button>
                  <button onClick={() => doExport('all', 'xlsx')} className="w-full text-left flex items-center gap-2 px-4 py-2 text-xs text-sigp-text hover:bg-navy-700"><FileSpreadsheet size={11} className="text-emerald-400" /> Excel — tout</button>
                  <button onClick={() => doExport('current', 'csv')} className="w-full text-left flex items-center gap-2 px-4 py-2 text-xs text-sigp-text hover:bg-navy-700"><File size={11} /> CSV</button>
                  <button onClick={() => doExport('current', 'print')} className="w-full text-left flex items-center gap-2 px-4 py-2 text-xs text-sigp-text hover:bg-navy-700"><FileText size={11} className="text-red-400" /> PDF (impression)</button>
                </div>
              )}
            </div>
            <button onClick={openCreate} className="btn-primary flex items-center gap-1.5 text-xs"><Plus size={13} /> Ajouter un Marché</button>
          </div>
        }
      />

      {isLoading ? <div className="flex justify-center py-16"><Loader2 className="animate-spin text-sigp-muted" /></div> : (
        <div className="flex-1 overflow-y-auto p-4 space-y-4">

          {/* KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Total Marchés', value: marches.length, color: 'text-sigp-text' },
              { label: 'En cours', value: nbEnCours, color: 'text-amber-400' },
              { label: 'Marchés signés', value: nbSignes, color: 'text-emerald-400' },
              { label: 'Montant Estimé Total', value: fmt(totalEstime) + ' ' + (project?.devise ?? ''), color: 'text-sigp-blue', small: true },
            ].map(k => (
              <div key={k.label} className="bg-navy-800 border border-navy-500 rounded-xl p-4">
                <p className="text-[10px] font-bold text-sigp-muted uppercase tracking-wider">{k.label}</p>
                <p className={`${k.small ? 'text-lg' : 'text-2xl'} font-bold mt-1 ${k.color}`}>{k.value}</p>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-sigp-muted" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher un marché..." className="sigp-input pl-8 py-1.5 text-xs w-56" />
            </div>
            <select value={filterStatut} onChange={e => setFilterStatut(e.target.value)} className="sigp-input py-1.5 text-xs w-36">
              <option value="">Tous statuts</option>
              {STATUTS.map(s => <option key={s} value={s}>{getStatutBadge(s).label}</option>)}
            </select>
            <select value={filterType} onChange={e => setFilterType(e.target.value)} className="sigp-input py-1.5 text-xs w-36">
              <option value="">Tous types</option>
              {TYPES_MARCHE.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <select value={filterMethode} onChange={e => setFilterMethode(e.target.value)} className="sigp-input py-1.5 text-xs w-36">
              <option value="">Toutes méthodes</option>
              {METHODES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            {hasFilters && <button onClick={() => { setSearch(''); setFilterStatut(''); setFilterType(''); setFilterMethode('') }} className="flex items-center gap-1.5 text-xs text-sigp-muted hover:text-sigp-text border border-navy-500 px-2.5 py-1.5 rounded-lg"><RotateCcw size={10} /> Réinitialiser</button>}
          </div>

          {/* Selection bar */}
          {selectedIds.size > 0 && (
            <div className="flex items-center justify-between px-4 py-2.5 bg-sigp-blue/10 border border-sigp-blue/30 rounded-xl">
              <span className="text-sigp-blue font-semibold text-sm flex items-center gap-2"><Check size={14} /> {selectedIds.size} marché(s) sélectionné(s)</span>
              <div className="flex gap-2">
                <button onClick={() => doExport('selected', 'xlsx')} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-sigp-blue text-white rounded-lg"><Download size={11} /> Exporter</button>
                <button onClick={() => setSelectedIds(new Set())} className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-sigp-muted border border-navy-500 rounded-lg"><X size={11} /> Annuler</button>
              </div>
            </div>
          )}

          {/* Table */}
          <div className="bg-navy-800 border border-navy-500 rounded-xl overflow-hidden">
            {filtered.length === 0 ? (
              <div className="py-12 text-center text-sigp-muted space-y-2">
                <p className="text-sm">{hasFilters ? 'Aucun marché ne correspond à ces filtres.' : 'Aucun marché dans le PPM.'}</p>
                {hasFilters && <button onClick={() => { setSearch(''); setFilterStatut(''); setFilterType(''); setFilterMethode('') }} className="text-xs text-sigp-blue hover:underline">Réinitialiser les filtres</button>}
                {!hasFilters && <button onClick={openCreate} className="text-xs text-sigp-blue hover:underline">Ajouter le premier marché</button>}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="excel-table min-w-[1000px]">
                  <thead>
                    <tr>
                      <th className="w-8"><input type="checkbox" checked={filtered.length > 0 && selectedIds.size === filtered.length} onChange={toggleSelectAll} className="accent-sigp-blue cursor-pointer" /></th>
                      <th className="w-1/3">Description du Marché</th>
                      <th>Type</th>
                      <th>Méthode</th>
                      <th className="text-right">Montant Estimé ({project?.devise})</th>
                      <th className="text-center">Date Prévue</th>
                      <th>Statut</th>
                      <th className="w-16 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(m => {
                      const badge = getStatutBadge(m.statut)
                      return (
                        <tr key={m.id} className={selectedIds.has(m.id) ? 'bg-sigp-blue/5' : ''}>
                          <td><input type="checkbox" checked={selectedIds.has(m.id)} onChange={() => toggleSelect(m.id)} className="accent-sigp-blue cursor-pointer" /></td>
                          <td className="text-xs font-medium whitespace-normal leading-relaxed">{m.description_marche}</td>
                          <td className="text-[10px] font-bold text-sigp-muted">{m.type_marche}</td>
                          <td className="text-[10px] font-bold text-sigp-blue">{m.methode}</td>
                          <td className="text-right font-mono font-bold text-amber-400 text-xs">{fmt(Number(m.montant_estime)||0)}</td>
                          <td className="text-center font-mono text-xs text-sigp-muted">{m.date_prevue ? new Date(m.date_prevue).toLocaleDateString('fr-FR') : '—'}</td>
                          <td><span className={`text-[10px] font-bold px-2 py-1 rounded-full ${badge.bg} ${badge.text}`}>{badge.label}</span></td>
                          <td className="text-center relative">
                            <button onClick={() => setOpenMenuId(openMenuId === m.id ? null : m.id)} className="text-sigp-muted hover:text-sigp-text p-1 rounded hover:bg-navy-700"><MoreHorizontal size={14} /></button>
                            {openMenuId === m.id && (
                              <div className="absolute right-2 top-8 w-36 bg-navy-800 border border-navy-500 rounded-xl shadow-2xl z-20 py-1 text-left">
                                <button onClick={() => { openEdit(m); setOpenMenuId(null) }} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-sigp-text hover:bg-navy-700"><Pencil size={11} /> Modifier</button>
                                <button onClick={() => { createMutation.mutateAsync({ ...m, id: undefined, description_marche: '[Copie] ' + m.description_marche } as any); setOpenMenuId(null) }} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-sigp-text hover:bg-navy-700"><Copy size={11} /> Dupliquer</button>
                                <div className="border-t border-navy-500 my-1" />
                                <button onClick={() => { deleteMutation.mutate(m.id); setOpenMenuId(null) }} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-400 hover:bg-red-500/10"><Trash2 size={11} /> Supprimer</button>
                              </div>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="bg-navy-900 font-bold">
                      <td colSpan={4} className="text-right text-xs text-sigp-muted py-3 px-4">TOTAL MONTANT ESTIMÉ</td>
                      <td className="text-right font-mono text-amber-400 py-3 px-4">{fmt(filtered.reduce((s, m) => s+(Number(m.montant_estime)||0), 0))}</td>
                      <td colSpan={3} />
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
          {filtered.length > 0 && <div className="text-xs text-sigp-muted text-right">{filtered.length} marché(s) sur {marches.length}</div>}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-navy-800 border border-navy-500 rounded-xl w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-navy-500">
              <h3 className="text-sm font-semibold text-sigp-text">{editMarche ? 'Modifier le marché' : 'Ajouter un Marché au PPM'}</h3>
              <button onClick={() => setShowModal(false)} className="text-sigp-muted hover:text-sigp-text"><X size={16} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="text-xs text-sigp-muted mb-1 block">Description du marché *</label>
                <textarea required rows={2} value={formData.description_marche ?? ''} onChange={e => setFormData({ ...formData, description_marche: e.target.value })} className="sigp-input resize-none" placeholder="Ex: Acquisition de matériel informatique..." />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-sigp-muted mb-1 block">Type</label>
                  <select value={formData.type_marche ?? 'TRAVAUX'} onChange={e => setFormData({ ...formData, type_marche: e.target.value as any })} className="sigp-input">
                    {TYPES_MARCHE.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-sigp-muted mb-1 block">Méthode</label>
                  <select value={formData.methode ?? 'AON'} onChange={e => setFormData({ ...formData, methode: e.target.value as any })} className="sigp-input">
                    {METHODES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-sigp-muted mb-1 block">Montant Estimé ({project?.devise})</label>
                  <input type="number" required min={0} value={formData.montant_estime ?? ''} onChange={e => setFormData({ ...formData, montant_estime: parseFloat(e.target.value) || '' })} className="sigp-input" />
                </div>
                <div>
                  <label className="text-xs text-sigp-muted mb-1 block">Date prévue</label>
                  <input type="date" value={formData.date_prevue ?? ''} onChange={e => setFormData({ ...formData, date_prevue: e.target.value })} className="sigp-input" />
                </div>
                {editMarche && (
                  <div className="col-span-2">
                    <label className="text-xs text-sigp-muted mb-1 block">Statut</label>
                    <select value={formData.statut ?? 'PLANIFIE'} onChange={e => setFormData({ ...formData, statut: e.target.value as any })} className="sigp-input">
                      {STATUTS.map(s => <option key={s} value={s}>{getStatutBadge(s).label}</option>)}
                    </select>
                  </div>
                )}
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-ghost">Annuler</button>
                <button type="submit" disabled={createMutation.isPending || updateMutation.isPending} className="btn-primary flex items-center gap-2">
                  {(createMutation.isPending || updateMutation.isPending) && <Loader2 size={14} className="animate-spin" />}
                  {editMarche ? 'Enregistrer' : 'Ajouter'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
