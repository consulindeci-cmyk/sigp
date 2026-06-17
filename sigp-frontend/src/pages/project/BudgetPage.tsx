import { useState, useRef, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import {
  Plus, Loader2, X, Download, ChevronDown, Search, Filter,
  MoreHorizontal, Pencil, Trash2, Copy, FileSpreadsheet, File,
  FileText, RotateCcw, Check, TrendingUp, Wallet, BarChart3
} from 'lucide-react'
import * as XLSX from 'xlsx'
import { PageHeader } from '@/components/layout/AppShell'
import { useBudget, useCreateBudgetLine, useUpdateBudgetLine, useDeleteBudgetLine } from '@/hooks/useBudget'
import { useProject } from '@/hooks/useProjects'
import type { LigneBudgetaireDetail } from '@/types'

const fmt = (n: number) => new Intl.NumberFormat('fr-FR').format(n)
const today = new Date().toISOString().slice(0, 10).replace(/-/g, '_')

export default function BudgetPage() {
  const { id: projectId = '' } = useParams()
  const { data: project } = useProject(projectId)
  const { data: budgetData, isLoading } = useBudget(projectId)
  const createMutation = useCreateBudgetLine(projectId)
  const updateMutation = useUpdateBudgetLine(projectId)
  const deleteMutation = useDeleteBudgetLine(projectId)

  const lignes: LigneBudgetaireDetail[] = (budgetData?.data ?? []) as LigneBudgetaireDetail[]

  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editLine, setEditLine] = useState<LigneBudgetaireDetail | null>(null)
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [showExportMenu, setShowExportMenu] = useState(false)
  const [showExportModal, setShowExportModal] = useState(false)
  const exportMenuRef = useRef<HTMLDivElement>(null)

  const [formData, setFormData] = useState<Partial<LigneBudgetaireDetail>>({
    code_budget: '', rubrique: '', unite: 'U', quantite: 1, cout_unitaire: 0
  })

  // Filtered data
  const filtered = lignes.filter(l =>
    !search ||
    l.rubrique?.toLowerCase().includes(search.toLowerCase()) ||
    l.code_budget?.toLowerCase().includes(search.toLowerCase())
  )

  // KPIs
  const totalBudget = lignes.reduce((acc, l) => acc + Number(l.cout_total || 0), 0)
  const budgetGlobal = Number(project?.budget_total || 0)
  const solde = budgetGlobal - totalBudget
  const tauxAllocation = budgetGlobal > 0 ? Math.round((totalBudget / budgetGlobal) * 100) : 0

  // Close menus on outside click
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
    setFormData({ code_budget: '', rubrique: '', unite: 'U', quantite: 1, cout_unitaire: 0 })
    setShowModal(true)
  }

  const openEdit = (l: LigneBudgetaireDetail) => {
    setEditLine(l)
    setFormData({ ...l })
    setShowModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const qt = formData.quantite || 1
    const cu = Number(formData.cout_unitaire) || 0
    const payload = { ...formData, cout_total: qt * cu }
    if (editLine) {
      await updateMutation.mutateAsync({ id: editLine.id, ...payload })
    } else {
      await createMutation.mutateAsync(payload)
    }
    setShowModal(false)
  }

  // Selection
  const toggleSelect = (id: string) => setSelectedIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  const toggleSelectAll = () => setSelectedIds(selectedIds.size === filtered.length ? new Set() : new Set(filtered.map(l => l.id)))

  // Export
  const buildRows = (data: LigneBudgetaireDetail[]) => data.map(l => ({
    'Code': l.code_budget,
    'Rubrique': l.rubrique,
    'Unité': l.unite || '—',
    'Quantité': Number(l.quantite),
    [`Coût Unitaire (${project?.devise})`]: Number(l.cout_unitaire),
    [`Coût Total (${project?.devise})`]: Number(l.cout_total),
  }))

  const doExport = (scope: 'current' | 'all' | 'selected', format: 'xlsx' | 'csv' | 'print') => {
    const data =
      scope === 'selected' ? lignes.filter(l => selectedIds.has(l.id)) :
      scope === 'all' ? lignes : filtered
    if (data.length === 0) return
    const rows = buildRows(data)
    const totalRow = { 'Code': 'TOTAL', 'Rubrique': '', 'Unité': '', 'Quantité': 0 as number, [`Coût Unitaire (${project?.devise})`]: 0, [`Coût Total (${project?.devise})`]: data.reduce((s, l) => s + Number(l.cout_total || 0), 0) }
    const allRows = [...rows, totalRow]

    if (format === 'csv') {
      const headers = Object.keys(rows[0])
      const csv = [headers.join(';'), ...allRows.map(r => headers.map(h => `"${(r as any)[h] ?? ''}"`).join(';'))].join('\n')
      const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `budget_${today}.csv`; a.click()
    } else if (format === 'xlsx') {
      const ws = XLSX.utils.json_to_sheet(allRows)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Budget')
      XLSX.writeFile(wb, `budget_${today}.xlsx`)
    } else {
      const html = `<!DOCTYPE html><html><head><title>Budget ${project?.code_projet}</title>
        <style>body{font-family:Arial;font-size:11px;margin:20px}h1{font-size:15px}p{font-size:10px;color:#666;margin-bottom:12px}
        table{width:100%;border-collapse:collapse}th,td{border:1px solid #ccc;padding:5px 8px}th{background:#1a2340;color:#fff;font-size:9px;text-transform:uppercase}
        tr:nth-child(even){background:#f5f7fa}.total{background:#1a2340;color:#fff;font-weight:bold}
        .num{text-align:right;font-family:monospace}@media print{body{margin:0}}</style></head><body>
        <h1>Budget Détaillé — ${project?.nom_projet ?? ''}</h1>
        <p>Projet : ${project?.code_projet ?? ''} | Export le ${new Date().toLocaleDateString('fr-FR')} | ${data.length} ligne(s)</p>
        <table><thead><tr><th>Code</th><th>Rubrique</th><th>Unité</th><th class="num">Quantité</th><th class="num">Coût Unitaire</th><th class="num">Coût Total (${project?.devise})</th></tr></thead>
        <tbody>${data.map(l => `<tr><td>${l.code_budget}</td><td>${l.rubrique}</td><td>${l.unite || ''}</td>
          <td class="num">${fmt(Number(l.quantite))}</td><td class="num">${fmt(Number(l.cout_unitaire))}</td>
          <td class="num"><strong>${fmt(Number(l.cout_total))}</strong></td></tr>`).join('')}
        <tr class="total"><td colspan="5"><strong>TOTAL BUDGET</strong></td><td class="num"><strong>${fmt(totalBudget)}</strong></td></tr>
        </tbody></table></body></html>`
      const w = window.open('', '_blank'); if (w) { w.document.write(html); w.document.close(); w.print() }
    }
    setShowExportMenu(false)
    setShowExportModal(false)
  }

  const formTotal = (formData.quantite || 0) * (Number(formData.cout_unitaire) || 0)

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title={`Budget — ${project?.code_projet ?? '…'}`}
        subtitle="Planification financière détaillée par rubrique"
        actions={
          <div className="flex items-center gap-2">
            <div className="relative" ref={exportMenuRef}>
              <button onClick={() => lignes.length > 0 && setShowExportMenu(v => !v)} disabled={lignes.length === 0}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border border-navy-500 text-sigp-muted hover:text-sigp-text hover:border-sigp-blue rounded-lg transition-all disabled:opacity-40">
                <Download size={13} /> Exporter <ChevronDown size={11} className={`transition-transform ${showExportMenu ? 'rotate-180' : ''}`} />
              </button>
              {showExportMenu && (
                <div className="absolute right-0 top-full mt-1 w-52 bg-navy-800 border border-navy-500 rounded-xl shadow-2xl z-30 py-1">
                  <div className="px-3 py-1.5 text-[10px] font-bold text-sigp-muted uppercase tracking-wider border-b border-navy-500">Format</div>
                  <button onClick={() => doExport('current', 'xlsx')} className="w-full text-left flex items-center gap-2 px-4 py-2 text-xs text-sigp-text hover:bg-navy-700"><FileSpreadsheet size={11} className="text-emerald-400" /> Excel (.xlsx) — vue actuelle</button>
                  <button onClick={() => doExport('all', 'xlsx')} className="w-full text-left flex items-center gap-2 px-4 py-2 text-xs text-sigp-text hover:bg-navy-700"><FileSpreadsheet size={11} className="text-emerald-400" /> Excel (.xlsx) — tout</button>
                  <button onClick={() => doExport('current', 'csv')} className="w-full text-left flex items-center gap-2 px-4 py-2 text-xs text-sigp-text hover:bg-navy-700"><File size={11} /> CSV — vue actuelle</button>
                  <button onClick={() => doExport('current', 'print')} className="w-full text-left flex items-center gap-2 px-4 py-2 text-xs text-sigp-text hover:bg-navy-700"><FileText size={11} className="text-red-400" /> PDF (impression)</button>
                </div>
              )}
            </div>
            <button onClick={openCreate} className="btn-primary flex items-center gap-1.5 text-xs">
              <Plus size={13} /> Nouvelle Rubrique
            </button>
          </div>
        }
      />

      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="animate-spin text-sigp-muted" /></div>
      ) : (
        <div className="flex-1 overflow-y-auto p-4 space-y-4">

          {/* KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-navy-800 border border-navy-500 rounded-xl p-4">
              <p className="text-[10px] font-bold text-sigp-muted uppercase tracking-wider flex items-center gap-1.5"><Wallet size={11} /> Budget Planifié</p>
              <p className="text-xl font-bold text-sigp-blue mt-1">{fmt(totalBudget)}</p>
              <p className="text-[10px] text-sigp-muted mt-0.5">{project?.devise}</p>
            </div>
            <div className="bg-navy-800 border border-navy-500 rounded-xl p-4">
              <p className="text-[10px] font-bold text-sigp-muted uppercase tracking-wider flex items-center gap-1.5"><BarChart3 size={11} /> Enveloppe Globale</p>
              <p className="text-xl font-bold text-white mt-1">{fmt(budgetGlobal)}</p>
              <p className="text-[10px] text-sigp-muted mt-0.5">{project?.devise}</p>
            </div>
            <div className="bg-navy-800 border border-navy-500 rounded-xl p-4">
              <p className="text-[10px] font-bold text-sigp-muted uppercase tracking-wider flex items-center gap-1.5"><TrendingUp size={11} /> Solde Non Alloué</p>
              <p className={`text-xl font-bold mt-1 ${solde < 0 ? 'text-red-400' : 'text-emerald-400'}`}>{fmt(solde)}</p>
              <p className="text-[10px] text-sigp-muted mt-0.5">{project?.devise}</p>
            </div>
            <div className="bg-navy-800 border border-navy-500 rounded-xl p-4">
              <p className="text-[10px] font-bold text-sigp-muted uppercase tracking-wider">Taux d'Allocation</p>
              <p className={`text-xl font-bold mt-1 ${tauxAllocation > 100 ? 'text-red-400' : 'text-amber-400'}`}>{tauxAllocation}%</p>
              <div className="w-full bg-navy-700 rounded-full h-1 mt-2">
                <div className={`h-1 rounded-full transition-all ${tauxAllocation > 100 ? 'bg-red-400' : 'bg-amber-400'}`} style={{ width: `${Math.min(tauxAllocation, 100)}%` }} />
              </div>
            </div>
          </div>

          {/* Search bar */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-sigp-muted" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher une rubrique..." className="sigp-input pl-8 py-1.5 text-xs w-full" />
            </div>
            {search && <button onClick={() => setSearch('')} className="flex items-center gap-1.5 text-xs text-sigp-muted hover:text-sigp-text"><RotateCcw size={10} /> Effacer</button>}
          </div>

          {/* Selection bar */}
          {selectedIds.size > 0 && (
            <div className="flex items-center justify-between px-4 py-2.5 bg-sigp-blue/10 border border-sigp-blue/30 rounded-xl text-sm">
              <span className="text-sigp-blue font-semibold flex items-center gap-2"><Check size={14} /> {selectedIds.size} ligne(s) sélectionnée(s)</span>
              <div className="flex gap-2">
                <button onClick={() => doExport('selected', 'xlsx')} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-sigp-blue text-white rounded-lg hover:bg-sigp-blue-light transition-colors"><Download size={11} /> Exporter la sélection</button>
                <button onClick={() => setSelectedIds(new Set())} className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-sigp-muted hover:text-sigp-text border border-navy-500 rounded-lg transition-colors"><X size={11} /> Annuler</button>
              </div>
            </div>
          )}

          {/* Table */}
          <div className="bg-navy-800 border border-navy-500 rounded-xl overflow-hidden">
            {filtered.length === 0 ? (
              <div className="py-12 text-center text-sigp-muted">
                {search ? <><p className="text-sm">Aucune rubrique ne correspond à "{search}"</p><button onClick={() => setSearch('')} className="text-xs text-sigp-blue hover:underline mt-2">Effacer la recherche</button></> : <><p className="text-sm">Aucune ligne budgétaire.</p><button onClick={openCreate} className="text-xs text-sigp-blue hover:underline mt-2">Ajouter la première rubrique</button></>}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="excel-table min-w-max">
                  <thead>
                    <tr>
                      <th className="w-8"><input type="checkbox" checked={filtered.length > 0 && selectedIds.size === filtered.length} onChange={toggleSelectAll} className="accent-sigp-blue cursor-pointer" /></th>
                      <th className="w-24">Code</th>
                      <th>Rubrique</th>
                      <th className="text-center w-20">Unité</th>
                      <th className="text-right w-28">Quantité</th>
                      <th className="text-right w-40">Coût Unitaire ({project?.devise})</th>
                      <th className="text-right w-40 bg-navy-900/50">Coût Total ({project?.devise})</th>
                      <th className="w-16 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(l => (
                      <tr key={l.id} className={selectedIds.has(l.id) ? 'bg-sigp-blue/5' : ''}>
                        <td><input type="checkbox" checked={selectedIds.has(l.id)} onChange={() => toggleSelect(l.id)} className="accent-sigp-blue cursor-pointer" /></td>
                        <td className="font-mono text-sigp-blue font-medium text-xs whitespace-nowrap">{l.code_budget}</td>
                        <td className="font-medium text-xs">{l.rubrique}</td>
                        <td className="text-center text-xs text-sigp-muted">{l.unite || '—'}</td>
                        <td className="text-right font-mono text-xs">{fmt(Number(l.quantite))}</td>
                        <td className="text-right font-mono text-xs text-amber-400">{fmt(Number(l.cout_unitaire))}</td>
                        <td className="text-right font-mono font-bold bg-navy-900/50 text-xs">{fmt(Number(l.cout_total))}</td>
                        <td className="text-center relative">
                          <button onClick={() => setOpenMenuId(openMenuId === l.id ? null : l.id)} className="text-sigp-muted hover:text-sigp-text p-1 rounded hover:bg-navy-700">
                            <MoreHorizontal size={14} />
                          </button>
                          {openMenuId === l.id && (
                            <div className="absolute right-2 top-8 w-36 bg-navy-800 border border-navy-500 rounded-xl shadow-2xl z-20 py-1 text-left">
                              <button onClick={() => { openEdit(l); setOpenMenuId(null) }} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-sigp-text hover:bg-navy-700"><Pencil size={11} /> Modifier</button>
                              <button onClick={() => { createMutation.mutateAsync({ ...l, id: undefined, code_budget: l.code_budget + '_copie' } as any); setOpenMenuId(null) }} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-sigp-text hover:bg-navy-700"><Copy size={11} /> Dupliquer</button>
                              <div className="border-t border-navy-500 my-1" />
                              <button onClick={() => { deleteMutation.mutate(l.id); setOpenMenuId(null) }} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-400 hover:bg-red-500/10"><Trash2 size={11} /> Supprimer</button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-navy-900 font-bold">
                      <td colSpan={6} className="text-right text-xs text-sigp-muted py-3 px-4">TOTAL BUDGET PLANIFIÉ</td>
                      <td className="text-right font-mono text-sigp-blue py-3 px-4">{fmt(filtered.reduce((s, l) => s + Number(l.cout_total || 0), 0))}</td>
                      <td />
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>

          {filtered.length > 0 && <div className="text-xs text-sigp-muted text-right">{filtered.length} ligne(s) affichée(s) sur {lignes.length}</div>}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-navy-800 border border-navy-500 rounded-xl w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-navy-500">
              <h3 className="text-sm font-semibold text-sigp-text">{editLine ? 'Modifier la rubrique' : 'Nouvelle Rubrique Budgétaire'}</h3>
              <button onClick={() => setShowModal(false)} className="text-sigp-muted hover:text-sigp-text"><X size={16} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1">
                  <label className="text-xs text-sigp-muted mb-1 block">Code *</label>
                  <input required value={formData.code_budget ?? ''} onChange={e => setFormData({ ...formData, code_budget: e.target.value })} className="sigp-input" placeholder="B.1.1" />
                </div>
                <div className="col-span-2">
                  <label className="text-xs text-sigp-muted mb-1 block">Rubrique *</label>
                  <input required value={formData.rubrique ?? ''} onChange={e => setFormData({ ...formData, rubrique: e.target.value })} className="sigp-input" placeholder="Ex: Achat véhicules" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-sigp-muted mb-1 block">Unité</label>
                  <input value={formData.unite ?? ''} onChange={e => setFormData({ ...formData, unite: e.target.value })} className="sigp-input" placeholder="U, FF, Mois..." />
                </div>
                <div>
                  <label className="text-xs text-sigp-muted mb-1 block">Quantité</label>
                  <input type="number" required min={0} step="0.01" value={formData.quantite ?? 1} onChange={e => setFormData({ ...formData, quantite: parseFloat(e.target.value) })} className="sigp-input" />
                </div>
                <div>
                  <label className="text-xs text-sigp-muted mb-1 block">Coût Unitaire ({project?.devise})</label>
                  <input type="number" required min={0} step="0.01" value={formData.cout_unitaire ?? 0} onChange={e => setFormData({ ...formData, cout_unitaire: parseFloat(e.target.value) })} className="sigp-input" />
                </div>
              </div>
              <div className="bg-navy-900 p-3 rounded-lg flex justify-between items-center">
                <span className="text-xs text-sigp-muted">Coût Total Calculé :</span>
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
