import { useState, useRef, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import {
  Plus, Loader2, X, Download, ChevronDown, Search,
  MoreHorizontal, Pencil, Trash2, Copy, FileSpreadsheet, File, FileText,
  RotateCcw, Check, TrendingUp, CheckCircle2, Clock, PauseCircle
} from 'lucide-react'
import * as XLSX from 'xlsx'
import { PageHeader } from '@/components/layout/AppShell'
import { usePTBA, useCreatePTBA, useUpdatePTBA, useDeletePTBA } from '@/hooks/usePTBA'
import { useProject } from '@/hooks/useProjects'
import type { PTBA } from '@/types'

const fmt = (n: number) => new Intl.NumberFormat('fr-FR').format(n)
const today = new Date().toISOString().slice(0, 10).replace(/-/g, '_')

const getStatutBadge = (statut: string) => {
  switch (statut) {
    case 'PLANIFIE': return { label: 'Planifié', bg: 'bg-blue-500/20', text: 'text-blue-400', icon: Clock }
    case 'EN_COURS': return { label: 'En cours', bg: 'bg-amber-500/20', text: 'text-amber-400', icon: TrendingUp }
    case 'TERMINE': return { label: 'Terminé', bg: 'bg-emerald-500/20', text: 'text-emerald-400', icon: CheckCircle2 }
    case 'SUSPENDU': return { label: 'Suspendu', bg: 'bg-red-500/20', text: 'text-red-400', icon: PauseCircle }
    default: return { label: statut, bg: 'bg-navy-700', text: 'text-sigp-muted', icon: Clock }
  }
}

export default function PTBAPage() {
  const { id: projectId = '' } = useParams()
  const { data: project } = useProject(projectId)
  const { data: ptbaData, isLoading } = usePTBA(projectId)
  const createMutation = useCreatePTBA(projectId)
  const updateMutation = useUpdatePTBA(projectId)
  const deleteMutation = useDeletePTBA(projectId)

  const lignes: PTBA[] = (ptbaData?.data ?? []) as PTBA[]

  const [search, setSearch] = useState('')
  const [filterStatut, setFilterStatut] = useState('')
  const [filterComposante, setFilterComposante] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editLine, setEditLine] = useState<PTBA | null>(null)
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [showExportMenu, setShowExportMenu] = useState(false)
  const exportMenuRef = useRef<HTMLDivElement>(null)

  const [formData, setFormData] = useState<Partial<PTBA>>({
    code_activite: '', composante: '', activite: '', q1: 0, q2: 0, q3: 0, q4: 0, statut: 'PLANIFIE'
  })

  const composantes = [...new Set(lignes.map(l => l.composante).filter(Boolean))]

  const filtered = lignes.filter(l => {
    if (search && !l.activite?.toLowerCase().includes(search.toLowerCase()) && !l.code_activite?.toLowerCase().includes(search.toLowerCase())) return false
    if (filterStatut && l.statut !== filterStatut) return false
    if (filterComposante && l.composante !== filterComposante) return false
    return true
  })

  const hasFilters = !!(search || filterStatut || filterComposante)

  // KPIs
  const totalAnnuel = lignes.reduce((s, l) => s + (Number(l.q1)||0) + (Number(l.q2)||0) + (Number(l.q3)||0) + (Number(l.q4)||0), 0)
  const terminees = lignes.filter(l => l.statut === 'TERMINE').length
  const enCours = lignes.filter(l => l.statut === 'EN_COURS').length
  const suspendues = lignes.filter(l => l.statut === 'SUSPENDU').length

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target as Node)) setShowExportMenu(false)
      setOpenMenuId(null)
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  const openCreate = () => {
    setEditLine(null)
    setFormData({ code_activite: '', composante: '', activite: '', q1: 0, q2: 0, q3: 0, q4: 0, statut: 'PLANIFIE' })
    setShowModal(true)
  }

  const openEdit = (l: PTBA) => {
    setEditLine(l)
    setFormData({ ...l })
    setShowModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const budget_prevu = (Number(formData.q1)||0) + (Number(formData.q2)||0) + (Number(formData.q3)||0) + (Number(formData.q4)||0)
    const payload = { ...formData, budget_prevu }
    if (editLine) {
      await updateMutation.mutateAsync({ id: editLine.id, ...payload })
    } else {
      await createMutation.mutateAsync(payload)
    }
    setShowModal(false)
  }

  const toggleSelect = (id: string) => setSelectedIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  const toggleSelectAll = () => setSelectedIds(selectedIds.size === filtered.length ? new Set() : new Set(filtered.map(l => l.id)))

  const doExport = (scope: 'current' | 'all' | 'selected', format: 'xlsx' | 'csv' | 'print') => {
    const data = scope === 'selected' ? lignes.filter(l => selectedIds.has(l.id)) : scope === 'all' ? lignes : filtered
    if (data.length === 0) return
    const rows = data.map(l => ({
      'Code': l.code_activite,
      'Composante': l.composante,
      'Activité': l.activite,
      [`Q1 (${project?.devise})`]: Number(l.q1),
      [`Q2 (${project?.devise})`]: Number(l.q2),
      [`Q3 (${project?.devise})`]: Number(l.q3),
      [`Q4 (${project?.devise})`]: Number(l.q4),
      [`Total (${project?.devise})`]: (Number(l.q1)||0)+(Number(l.q2)||0)+(Number(l.q3)||0)+(Number(l.q4)||0),
      'Statut': getStatutBadge(l.statut).label,
    }))
    if (format === 'xlsx') {
      const ws = XLSX.utils.json_to_sheet(rows)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'PTBA')
      XLSX.writeFile(wb, `ptba_${today}.xlsx`)
    } else if (format === 'csv') {
      const headers = Object.keys(rows[0])
      const csv = [headers.join(';'), ...rows.map(r => headers.map(h => `"${(r as any)[h] ?? ''}"`).join(';'))].join('\n')
      const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `ptba_${today}.csv`; a.click()
    } else {
      const html = `<!DOCTYPE html><html><head><title>PTBA ${project?.code_projet}</title>
        <style>body{font-family:Arial;font-size:10px;margin:20px}h1{font-size:14px}p{font-size:10px;color:#666;margin-bottom:10px}
        table{width:100%;border-collapse:collapse}th,td{border:1px solid #ccc;padding:4px 6px}th{background:#1a2340;color:#fff;font-size:9px;text-transform:uppercase}
        tr:nth-child(even){background:#f5f7fa}.total{background:#1a2340;color:#fff}.num{text-align:right;font-family:monospace}@media print{body{margin:0}}</style></head><body>
        <h1>PTBA — ${project?.nom_projet ?? ''}</h1>
        <p>Export le ${new Date().toLocaleDateString('fr-FR')} | ${data.length} activité(s) | Total : ${fmt(totalAnnuel)} ${project?.devise}</p>
        <table><thead><tr><th>Code</th><th>Composante</th><th>Activité</th><th class="num">Q1</th><th class="num">Q2</th><th class="num">Q3</th><th class="num">Q4</th><th class="num">Total</th><th>Statut</th></tr></thead>
        <tbody>${data.map(l => { const tot = (Number(l.q1)||0)+(Number(l.q2)||0)+(Number(l.q3)||0)+(Number(l.q4)||0); return `<tr><td>${l.code_activite}</td><td>${l.composante}</td><td>${l.activite}</td><td class="num">${fmt(Number(l.q1))}</td><td class="num">${fmt(Number(l.q2))}</td><td class="num">${fmt(Number(l.q3))}</td><td class="num">${fmt(Number(l.q4))}</td><td class="num"><strong>${fmt(tot)}</strong></td><td>${getStatutBadge(l.statut).label}</td></tr>` }).join('')}
        <tr class="total"><td colspan="7" class="num"><strong>TOTAL</strong></td><td class="num"><strong>${fmt(data.reduce((s,l) => s+(Number(l.q1)||0)+(Number(l.q2)||0)+(Number(l.q3)||0)+(Number(l.q4)||0), 0))}</strong></td><td></td></tr>
        </tbody></table></body></html>`
      const w = window.open('', '_blank'); if (w) { w.document.write(html); w.document.close(); w.print() }
    }
    setShowExportMenu(false)
  }

  const formTotal = (Number(formData.q1)||0)+(Number(formData.q2)||0)+(Number(formData.q3)||0)+(Number(formData.q4)||0)

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title={`PTBA — ${project?.code_projet ?? '…'}`}
        subtitle="Plan de Travail et Budget Annuel"
        actions={
          <div className="flex items-center gap-2">
            <div className="relative" ref={exportMenuRef}>
              <button onClick={() => lignes.length > 0 && setShowExportMenu(v => !v)} disabled={lignes.length === 0}
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
            <button onClick={openCreate} className="btn-primary flex items-center gap-1.5 text-xs"><Plus size={13} /> Ajouter Activité</button>
          </div>
        }
      />

      {isLoading ? <div className="flex justify-center py-16"><Loader2 className="animate-spin text-sigp-muted" /></div> : (
        <div className="flex-1 overflow-y-auto p-4 space-y-4">

          {/* KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Total Activités', value: lignes.length, color: 'text-sigp-text' },
              { label: 'En cours', value: enCours, color: 'text-amber-400' },
              { label: 'Terminées', value: terminees, color: 'text-emerald-400' },
              { label: 'Budget annuel total', value: fmt(totalAnnuel) + ' ' + (project?.devise ?? ''), color: 'text-sigp-blue', small: true },
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
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher une activité..." className="sigp-input pl-8 py-1.5 text-xs w-56" />
            </div>
            <select value={filterStatut} onChange={e => setFilterStatut(e.target.value)} className="sigp-input py-1.5 text-xs w-36">
              <option value="">Tous statuts</option>
              <option value="PLANIFIE">Planifié</option>
              <option value="EN_COURS">En cours</option>
              <option value="TERMINE">Terminé</option>
              <option value="SUSPENDU">Suspendu</option>
            </select>
            {composantes.length > 0 && (
              <select value={filterComposante} onChange={e => setFilterComposante(e.target.value)} className="sigp-input py-1.5 text-xs w-44">
                <option value="">Toutes composantes</option>
                {composantes.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            )}
            {hasFilters && <button onClick={() => { setSearch(''); setFilterStatut(''); setFilterComposante('') }} className="flex items-center gap-1.5 text-xs text-sigp-muted hover:text-sigp-text border border-navy-500 px-2.5 py-1.5 rounded-lg"><RotateCcw size={10} /> Réinitialiser</button>}
          </div>

          {/* Selection bar */}
          {selectedIds.size > 0 && (
            <div className="flex items-center justify-between px-4 py-2.5 bg-sigp-blue/10 border border-sigp-blue/30 rounded-xl">
              <span className="text-sigp-blue font-semibold text-sm flex items-center gap-2"><Check size={14} /> {selectedIds.size} activité(s) sélectionnée(s)</span>
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
                <p className="text-sm">{hasFilters ? 'Aucune activité ne correspond à ces filtres.' : 'Aucune activité dans le PTBA.'}</p>
                {hasFilters && <button onClick={() => { setSearch(''); setFilterStatut(''); setFilterComposante('') }} className="text-xs text-sigp-blue hover:underline">Réinitialiser les filtres</button>}
                {!hasFilters && <button onClick={openCreate} className="text-xs text-sigp-blue hover:underline">Ajouter la première activité</button>}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="excel-table min-w-[900px]">
                  <thead>
                    <tr>
                      <th className="w-8"><input type="checkbox" checked={filtered.length > 0 && selectedIds.size === filtered.length} onChange={toggleSelectAll} className="accent-sigp-blue cursor-pointer" /></th>
                      <th className="w-20">Code</th>
                      <th className="w-36">Composante</th>
                      <th>Activité</th>
                      <th className="text-right">Q1</th>
                      <th className="text-right">Q2</th>
                      <th className="text-right">Q3</th>
                      <th className="text-right">Q4</th>
                      <th className="text-right bg-navy-900/50">Total ({project?.devise})</th>
                      <th className="w-24">Statut</th>
                      <th className="w-16 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(l => {
                      const tot = (Number(l.q1)||0)+(Number(l.q2)||0)+(Number(l.q3)||0)+(Number(l.q4)||0)
                      const badge = getStatutBadge(l.statut)
                      return (
                        <tr key={l.id} className={selectedIds.has(l.id) ? 'bg-sigp-blue/5' : ''}>
                          <td><input type="checkbox" checked={selectedIds.has(l.id)} onChange={() => toggleSelect(l.id)} className="accent-sigp-blue cursor-pointer" /></td>
                          <td className="font-mono text-sigp-blue font-medium text-xs whitespace-nowrap">{l.code_activite}</td>
                          <td className="text-xs text-sigp-muted">{l.composante}</td>
                          <td className="text-xs whitespace-normal">{l.activite}</td>
                          {[l.q1, l.q2, l.q3, l.q4].map((q, i) => <td key={i} className="text-right font-mono text-xs">{fmt(Number(q)||0)}</td>)}
                          <td className="text-right font-mono font-bold text-amber-400 bg-navy-900/50 text-xs">{fmt(tot)}</td>
                          <td><span className={`text-[10px] font-bold px-2 py-1 rounded-full ${badge.bg} ${badge.text}`}>{badge.label}</span></td>
                          <td className="text-center relative">
                            <button onClick={() => setOpenMenuId(openMenuId === l.id ? null : l.id)} className="text-sigp-muted hover:text-sigp-text p-1 rounded hover:bg-navy-700"><MoreHorizontal size={14} /></button>
                            {openMenuId === l.id && (
                              <div className="absolute right-2 top-8 w-36 bg-navy-800 border border-navy-500 rounded-xl shadow-2xl z-20 py-1 text-left">
                                <button onClick={() => { openEdit(l); setOpenMenuId(null) }} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-sigp-text hover:bg-navy-700"><Pencil size={11} /> Modifier</button>
                                <button onClick={() => { createMutation.mutateAsync({ ...l, id: undefined, code_activite: l.code_activite + '_copie' } as any); setOpenMenuId(null) }} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-sigp-text hover:bg-navy-700"><Copy size={11} /> Dupliquer</button>
                                <div className="border-t border-navy-500 my-1" />
                                <button onClick={() => { deleteMutation.mutate(l.id); setOpenMenuId(null) }} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-400 hover:bg-red-500/10"><Trash2 size={11} /> Supprimer</button>
                              </div>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="bg-navy-900 font-bold">
                      <td colSpan={8} className="text-right text-xs text-sigp-muted py-3 px-4">TOTAL PTBA</td>
                      <td className="text-right font-mono text-amber-400 py-3 px-4">{fmt(filtered.reduce((s, l) => s+(Number(l.q1)||0)+(Number(l.q2)||0)+(Number(l.q3)||0)+(Number(l.q4)||0), 0))}</td>
                      <td colSpan={2} />
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
          {filtered.length > 0 && <div className="text-xs text-sigp-muted text-right">{filtered.length} activité(s) sur {lignes.length}</div>}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-navy-800 border border-navy-500 rounded-xl w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-navy-500">
              <h3 className="text-sm font-semibold text-sigp-text">{editLine ? 'Modifier l\'activité' : 'Ajouter une Activité au PTBA'}</h3>
              <button onClick={() => setShowModal(false)} className="text-sigp-muted hover:text-sigp-text"><X size={16} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div><label className="text-xs text-sigp-muted mb-1 block">Code *</label><input required value={formData.code_activite ?? ''} onChange={e => setFormData({ ...formData, code_activite: e.target.value })} className="sigp-input" placeholder="A.1" /></div>
                <div className="col-span-2"><label className="text-xs text-sigp-muted mb-1 block">Composante *</label><input required value={formData.composante ?? ''} onChange={e => setFormData({ ...formData, composante: e.target.value })} className="sigp-input" placeholder="Composante 1" /></div>
              </div>
              <div>
                <label className="text-xs text-sigp-muted mb-1 block">Activité *</label>
                <textarea required rows={2} value={formData.activite ?? ''} onChange={e => setFormData({ ...formData, activite: e.target.value })} className="sigp-input resize-none" placeholder="Description de l'activité..." />
              </div>
              <div className="grid grid-cols-4 gap-2">
                {[1, 2, 3, 4].map(q => (
                  <div key={q}><label className="text-xs text-sigp-muted mb-1 block">Q{q}</label><input type="number" min={0} value={(formData as any)[`q${q}`] ?? 0} onChange={e => setFormData({ ...formData, [`q${q}`]: parseFloat(e.target.value) || 0 })} className="sigp-input" /></div>
                ))}
              </div>
              <div>
                <label className="text-xs text-sigp-muted mb-1 block">Statut</label>
                <select value={formData.statut ?? 'PLANIFIE'} onChange={e => setFormData({ ...formData, statut: e.target.value as any })} className="sigp-input">
                  <option value="PLANIFIE">Planifié</option>
                  <option value="EN_COURS">En cours</option>
                  <option value="TERMINE">Terminé</option>
                  <option value="SUSPENDU">Suspendu</option>
                </select>
              </div>
              <div className="bg-navy-900 p-3 rounded-lg flex justify-between items-center">
                <span className="text-xs text-sigp-muted">Budget Annuel Total :</span>
                <span className="font-mono font-bold text-sigp-blue text-lg">{fmt(formTotal)} <span className="text-xs font-normal text-sigp-muted">{project?.devise}</span></span>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-ghost">Annuler</button>
                <button type="submit" disabled={createMutation.isPending || updateMutation.isPending} className="btn-primary flex items-center gap-2">
                  {(createMutation.isPending || updateMutation.isPending) && <Loader2 size={14} className="animate-spin" />}
                  {editLine ? 'Enregistrer' : 'Ajouter'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
