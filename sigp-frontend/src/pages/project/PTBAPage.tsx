import React, { useState, useRef, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useUIStore } from '@/stores/uiStore'
import { AlertCircle, Plus, Search, ChevronDown, Download, MoreHorizontal, Pencil, Trash2, Loader2, ArrowUpDown } from 'lucide-react'
import { usePTBA, useCreatePTBA, useUpdatePTBA, useDeletePTBA } from '@/hooks/usePTBA'
import { useProject } from '@/hooks/useProjects'
import * as XLSX from 'xlsx'
import type { PTBA } from '@/types'

const fmt = (n: number) => new Intl.NumberFormat('fr-FR').format(n)

export default function PTBAPage() {
  const { id: urlProjectId } = useParams()
  const { activeProjectId, activeProjectName } = useUIStore()
  
  const resolvedProjectId = urlProjectId || activeProjectId || ''

  const { data: project } = useProject(resolvedProjectId)
  const { data: ptbaData, isLoading } = usePTBA(resolvedProjectId)
  const createMutation = useCreatePTBA(resolvedProjectId)
  const updateMutation = useUpdatePTBA(resolvedProjectId)
  const deleteMutation = useDeletePTBA(resolvedProjectId)

  const lignes: PTBA[] = (ptbaData?.data ?? []) as PTBA[]

  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editLine, setEditLine] = useState<PTBA | null>(null)
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [sortConfig, setSortConfig] = useState<{ key: keyof PTBA; direction: 'asc' | 'desc' } | null>(null)

  const [formData, setFormData] = useState<Partial<PTBA>>({
    code_activite: '', composante: '', activite: '', responsable: '', q1: 0, q2: 0, q3: 0, q4: 0, statut: 'PLANIFIE', pourcentage_avancement: 0
  })

  // Export menu
  const [showExportMenu, setShowExportMenu] = useState(false)
  const exportMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target as Node)) setShowExportMenu(false)
      setOpenMenuId(null)
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  if (!resolvedProjectId) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-[#F5F6F8] p-6 h-full">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200 text-center max-w-md">
          <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle size={32} />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Aucun projet sélectionné</h2>
          <p className="text-gray-500 mb-6">
            Veuillez sélectionner un projet avant de consulter le PTBA.
          </p>
        </div>
      </div>
    )
  }

  const openCreate = () => {
    setEditLine(null)
    setFormData({ code_activite: '', composante: '', activite: '', responsable: '', q1: 0, q2: 0, q3: 0, q4: 0, statut: 'PLANIFIE', pourcentage_avancement: 0 })
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
    try {
      if (editLine) {
        await updateMutation.mutateAsync({ id: editLine.id, ...payload })
      } else {
        await createMutation.mutateAsync(payload)
      }
      setShowModal(false)
    } catch (err) {
      console.error(err)
    }
  }

  const doExport = (format: 'xlsx' | 'print') => {
    const data = filtered
    if (data.length === 0) return
    const rows = data.map(l => ({
      'Code': l.code_activite,
      'Activité': l.activite,
      'Responsable': l.responsable ?? '',
      [`Q1 (${project?.devise ?? ''})`]: Number(l.q1),
      [`Q2 (${project?.devise ?? ''})`]: Number(l.q2),
      [`Q3 (${project?.devise ?? ''})`]: Number(l.q3),
      [`Q4 (${project?.devise ?? ''})`]: Number(l.q4),
      [`Total (${project?.devise ?? ''})`]: (Number(l.q1)||0)+(Number(l.q2)||0)+(Number(l.q3)||0)+(Number(l.q4)||0),
      'Statut': l.statut,
    }))
    if (format === 'xlsx') {
      const ws = XLSX.utils.json_to_sheet(rows)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'PTBA')
      XLSX.writeFile(wb, `ptba.xlsx`)
    } else {
      const html = `<!DOCTYPE html><html><head><title>PTBA</title>
        <style>body{font-family:Arial;font-size:10px;margin:20px}h1{font-size:14px}p{font-size:10px;color:#666;margin-bottom:10px}
        table{width:100%;border-collapse:collapse}th,td{border:1px solid #ccc;padding:4px 6px}th{background:#0A1628;color:#fff;font-size:9px;text-transform:uppercase}
        tr:nth-child(even){background:#f5f7fa}.total{background:#0A1628;color:#fff}.num{text-align:right;font-family:monospace}@media print{body{margin:0}}</style></head><body>
        <h1>PTBA — ${project?.nom_projet ?? activeProjectName ?? ''}</h1>
        <p>Export le ${new Date().toLocaleDateString('fr-FR')} | ${data.length} activité(s)</p>
        <table><thead><tr><th>Code</th><th>Activité</th><th>Responsable</th><th class="num">Q1</th><th class="num">Q2</th><th class="num">Q3</th><th class="num">Q4</th><th class="num">Total</th><th>Statut</th></tr></thead>
        <tbody>${data.map(l => { const tot = (Number(l.q1)||0)+(Number(l.q2)||0)+(Number(l.q3)||0)+(Number(l.q4)||0); return `<tr><td>${l.code_activite}</td><td>${l.activite}</td><td>${l.responsable ?? ''}</td><td class="num">${fmt(Number(l.q1))}</td><td class="num">${fmt(Number(l.q2))}</td><td class="num">${fmt(Number(l.q3))}</td><td class="num">${fmt(Number(l.q4))}</td><td class="num"><strong>${fmt(tot)}</strong></td><td>${l.statut}</td></tr>` }).join('')}
        </tbody></table></body></html>`
      const w = window.open('', '_blank'); if (w) { w.document.write(html); w.document.close(); w.print() }
    }
    setShowExportMenu(false)
  }

  const handleSort = (key: keyof PTBA) => {
    setSortConfig(current => ({
      key,
      direction: current?.key === key && current.direction === 'asc' ? 'desc' : 'asc'
    }))
  }

  // Filtrage et Tri
  let filtered = lignes.filter(l => {
    if (search && !l.activite?.toLowerCase().includes(search.toLowerCase()) && !l.code_activite?.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  if (sortConfig) {
    filtered.sort((a, b) => {
      const aVal = a[sortConfig.key] ?? ''
      const bVal = b[sortConfig.key] ?? ''
      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1
      return 0
    })
  }

  // KPI calculs
  const totalAnnuel = lignes.reduce((s, l) => s + (Number(l.q1)||0) + (Number(l.q2)||0) + (Number(l.q3)||0) + (Number(l.q4)||0), 0)
  const terminees = lignes.filter(l => l.statut === 'TERMINE').length
  const enRetard = lignes.filter(l => l.statut === 'SUSPENDU').length

  const formTotal = (Number(formData.q1)||0)+(Number(formData.q2)||0)+(Number(formData.q3)||0)+(Number(formData.q4)||0)

  // Status mappings for display
  const statutStyles = {
    'TERMINE': 'text-[#16A34A] font-medium',
    'EN_COURS': 'text-[#2563EB] font-medium',
    'PLANIFIE': 'text-[#6B7280] font-medium',
    'SUSPENDU': 'text-[#DC2626] font-medium',
  }
  
  const statutLabels = {
    'TERMINE': 'Terminé',
    'EN_COURS': 'En cours',
    'PLANIFIE': 'Planifié',
    'SUSPENDU': 'Suspendu',
  }

  const getBarColor = (statut: string) => {
    switch(statut) {
      case 'TERMINE': return 'bg-[#16A34A]'
      case 'EN_COURS': return 'bg-[#2563EB]'
      case 'SUSPENDU': return 'bg-[#F97316]'
      default: return 'bg-[#E5E7EB]'
    }
  }

  return (
    <div className="flex flex-col h-full bg-[#F5F6F8]">
      {/* 1. En-tête de page contextuelle */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 shrink-0">
        <h1 className="text-xl font-bold text-gray-900">
          PTBA {activeProjectName ? `— ${activeProjectName}` : ''}
        </h1>
        <p className="text-[#6B7280] text-sm mt-0.5">
          Plan de Travail et Budget Annuel : activités, responsables, trimestres, budget prévu et état d'exécution.
        </p>
      </div>

      <div className="flex-1 overflow-auto p-6">
        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="animate-spin text-[#2563EB] w-8 h-8" />
          </div>
        ) : (
          <>
            {/* 2. Cartes KPI */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
                <p className="text-[#6B7280] text-sm font-semibold mb-3">Activités</p>
                <p className="text-2xl font-bold text-[#2563EB]">{lignes.length}</p>
              </div>
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
                <p className="text-[#6B7280] text-sm font-semibold mb-3">Budget PTBA</p>
                <p className="text-2xl font-bold text-[#16A34A]">{fmt(totalAnnuel)}</p>
              </div>
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
                <p className="text-[#6B7280] text-sm font-semibold mb-3">Réalisées</p>
                <p className="text-2xl font-bold text-[#16A34A]">{terminees}</p>
              </div>
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
                <p className="text-[#6B7280] text-sm font-semibold mb-3">En retard</p>
                <p className="text-2xl font-bold text-[#DC2626]">{enRetard}</p>
              </div>
            </div>

            {/* Barre d'outils discrète */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input 
                  type="text" 
                  placeholder="Rechercher par code ou activité..." 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm w-full sm:w-72 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]"
                />
              </div>
              <div className="flex items-center gap-2">
                <div className="relative" ref={exportMenuRef}>
                  <button onClick={() => setShowExportMenu(!showExportMenu)} disabled={filtered.length === 0}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors">
                    <Download size={16} /> Exporter <ChevronDown size={14} />
                  </button>
                  {showExportMenu && (
                    <div className="absolute right-0 top-full mt-1 w-40 bg-white border border-gray-200 rounded-xl shadow-xl z-20 py-1">
                      <button onClick={() => doExport('xlsx')} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Format Excel</button>
                      <button onClick={() => doExport('print')} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Format PDF</button>
                    </div>
                  )}
                </div>
                <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-[#2563EB] hover:bg-blue-700 rounded-lg transition-colors shadow-sm">
                  <Plus size={16} /> Ajouter
                </button>
              </div>
            </div>

            {/* 3. Tableau PTBA */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mb-6">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[900px]">
                  <thead>
                    <tr className="bg-[#0A1628] text-white">
                      <th className="py-3 px-4 text-sm font-bold cursor-pointer hover:bg-white/5" onClick={() => handleSort('code_activite')}>Code <ArrowUpDown size={12} className="inline ml-1 opacity-50" /></th>
                      <th className="py-3 px-4 text-sm font-bold cursor-pointer hover:bg-white/5" onClick={() => handleSort('activite')}>Activité <ArrowUpDown size={12} className="inline ml-1 opacity-50" /></th>
                      <th className="py-3 px-4 text-sm font-bold cursor-pointer hover:bg-white/5" onClick={() => handleSort('responsable')}>Resp. <ArrowUpDown size={12} className="inline ml-1 opacity-50" /></th>
                      <th className="py-3 px-4 text-sm font-bold text-center w-12">Q1</th>
                      <th className="py-3 px-4 text-sm font-bold text-center w-12">Q2</th>
                      <th className="py-3 px-4 text-sm font-bold text-center w-12">Q3</th>
                      <th className="py-3 px-4 text-sm font-bold text-center w-12">Q4</th>
                      <th className="py-3 px-4 text-sm font-bold text-right cursor-pointer hover:bg-white/5" onClick={() => handleSort('budget_prevu')}>Budget <ArrowUpDown size={12} className="inline ml-1 opacity-50" /></th>
                      <th className="py-3 px-4 text-sm font-bold cursor-pointer hover:bg-white/5" onClick={() => handleSort('statut')}>Statut <ArrowUpDown size={12} className="inline ml-1 opacity-50" /></th>
                      <th className="py-3 px-4 text-sm font-bold text-center w-16">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filtered.length === 0 ? (
                      <tr>
                        <td colSpan={10} className="py-8 text-center text-gray-500 text-sm">
                          Aucune activité trouvée.
                        </td>
                      </tr>
                    ) : (
                      filtered.map(l => {
                        const tot = (Number(l.q1)||0)+(Number(l.q2)||0)+(Number(l.q3)||0)+(Number(l.q4)||0)
                        return (
                          <tr key={l.id} className="hover:bg-gray-50 transition-colors">
                            <td className="py-3 px-4 text-sm text-gray-900 font-medium whitespace-nowrap">{l.code_activite}</td>
                            <td className="py-3 px-4 text-sm text-[#6B7280] max-w-xs truncate" title={l.activite}>{l.activite}</td>
                            <td className="py-3 px-4 text-sm text-[#6B7280]">{l.responsable || '-'}</td>
                            <td className="py-3 px-4 text-sm text-center font-bold text-gray-900 w-12">{(Number(l.q1)||0) > 0 ? '•' : '—'}</td>
                            <td className="py-3 px-4 text-sm text-center font-bold text-gray-900 w-12">{(Number(l.q2)||0) > 0 ? '•' : '—'}</td>
                            <td className="py-3 px-4 text-sm text-center font-bold text-gray-900 w-12">{(Number(l.q3)||0) > 0 ? '•' : '—'}</td>
                            <td className="py-3 px-4 text-sm text-center font-bold text-gray-900 w-12">{(Number(l.q4)||0) > 0 ? '•' : '—'}</td>
                            <td className="py-3 px-4 text-sm text-right text-gray-900 font-mono whitespace-nowrap">{fmt(tot)}</td>
                            <td className={`py-3 px-4 text-sm ${statutStyles[l.statut] || 'text-gray-500'}`}>{statutLabels[l.statut] || l.statut}</td>
                            <td className="py-3 px-4 text-sm text-center relative">
                              <button onClick={() => setOpenMenuId(openMenuId === l.id ? null : l.id)} className="text-gray-400 hover:text-gray-600 p-1 rounded-md hover:bg-gray-100 transition-colors">
                                <MoreHorizontal size={16} />
                              </button>
                              {openMenuId === l.id && (
                                <div className="absolute right-12 top-8 bg-white border border-gray-200 shadow-xl rounded-xl w-36 py-1 z-20 text-left">
                                  <button onClick={() => { openEdit(l); setOpenMenuId(null) }} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"><Pencil size={14} /> Modifier</button>
                                  <button onClick={async () => { await deleteMutation.mutateAsync(l.id); setOpenMenuId(null) }} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"><Trash2 size={14} /> Supprimer</button>
                                </div>
                              )}
                            </td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 4. Carte : Planification visuelle par trimestre */}
            {filtered.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
                <h3 className="text-lg font-bold text-[#0A1628] mb-6">Planification visuelle par trimestre</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                  {filtered.map(l => {
                    const progress = l.pourcentage_avancement || (l.statut === 'TERMINE' ? 100 : l.statut === 'EN_COURS' ? 50 : 0)
                    const labelColor = l.statut === 'TERMINE' ? 'text-[#16A34A]' : l.statut === 'EN_COURS' ? 'text-[#2563EB]' : l.statut === 'SUSPENDU' ? 'text-[#F97316]' : 'text-[#6B7280]'
                    
                    return (
                      <div key={l.id}>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium text-gray-900 truncate pr-2" title={l.activite}>{l.code_activite}</span>
                          <span className={`text-sm font-bold ${labelColor}`}>{progress}%</span>
                        </div>
                        <div className="w-full bg-[#E5E7EB] rounded-full h-2 overflow-hidden">
                          <div className={`${getBarColor(l.statut)} h-2 rounded-full transition-all duration-500`} style={{ width: `${progress}%` }}></div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modale CRUD */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50 shrink-0">
              <h3 className="text-lg font-bold text-gray-900">
                {editLine ? 'Modifier l\'activité' : 'Ajouter une activité au PTBA'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <span className="sr-only">Fermer</span>
                <AlertCircle size={20} className="rotate-45" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 flex-1 overflow-y-auto">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Code activité *</label>
                  <input required value={formData.code_activite} onChange={e => setFormData({...formData, code_activite: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]" placeholder="Ex: 1.1" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Composante *</label>
                  <input required value={formData.composante} onChange={e => setFormData({...formData, composante: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]" placeholder="Ex: Composante 1" />
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-1">Description de l'activité *</label>
                <textarea required rows={2} value={formData.activite} onChange={e => setFormData({...formData, activite: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] resize-none" placeholder="Intitulé de l'activité..." />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-1">Responsable</label>
                <input value={formData.responsable || ''} onChange={e => setFormData({...formData, responsable: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]" placeholder="Cabinet, BTP..." />
              </div>

              <div className="grid grid-cols-4 gap-4 mb-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
                {[1, 2, 3, 4].map(q => (
                  <div key={q}>
                    <label className="block text-sm font-semibold text-gray-700 mb-1 text-center">Budget Q{q}</label>
                    <input type="number" min="0" value={(formData as any)[`q${q}`]} onChange={e => setFormData({...formData, [`q${q}`]: parseFloat(e.target.value)||0})} className="w-full px-2 py-2 border border-gray-200 rounded-lg text-sm text-center focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]" />
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Statut</label>
                  <select value={formData.statut} onChange={e => setFormData({...formData, statut: e.target.value as any})} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] bg-white">
                    <option value="PLANIFIE">Planifié</option>
                    <option value="EN_COURS">En cours</option>
                    <option value="SUSPENDU">Suspendu</option>
                    <option value="TERMINE">Terminé</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Avancement (%)</label>
                  <input type="number" min="0" max="100" value={formData.pourcentage_avancement || 0} onChange={e => setFormData({...formData, pourcentage_avancement: parseFloat(e.target.value)||0})} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]" />
                </div>
              </div>

              <div className="bg-[#0A1628] rounded-xl p-4 flex items-center justify-between mt-2">
                <span className="text-sm font-semibold text-gray-300">Budget PTBA Prévu</span>
                <span className="text-xl font-mono font-bold text-white">{fmt(formTotal)} <span className="text-sm text-gray-400 font-normal">{project?.devise ?? ''}</span></span>
              </div>

              <div className="flex justify-end gap-3 pt-6 mt-4 border-t border-gray-100">
                <button type="button" onClick={() => setShowModal(false)} className="px-5 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors">
                  Annuler
                </button>
                <button type="submit" disabled={createMutation.isPending || updateMutation.isPending} className="px-5 py-2.5 text-sm font-semibold text-white bg-[#2563EB] hover:bg-blue-700 rounded-xl transition-colors shadow-sm flex items-center gap-2">
                  {(createMutation.isPending || updateMutation.isPending) && <Loader2 size={16} className="animate-spin" />}
                  {editLine ? 'Mettre à jour' : 'Créer l\'activité'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
