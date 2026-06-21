import { useState, useRef, useEffect, useMemo } from 'react'
import { Search, X, MoreVertical, Download, ChevronDown, Check, FileText, FileSpreadsheet, File } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useProjects, useCreateProject } from '@/hooks/useProjects'
import { useDashboard } from '@/hooks/useDashboard'
import { formatCurrency, formatDate, formatPercent } from '@/lib/utils'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/axios'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import * as XLSX from 'xlsx'
import { useUIStore } from '@/stores/uiStore'

const schema = z.object({
  code_projet: z.string().optional(),
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

export default function ProjectsPage() {
  const qc = useQueryClient()
  const navigate = useNavigate()
  const setActiveProject = useUIStore(state => state.setActiveProject)
  const activeProjectId = useUIStore(state => state.activeProjectId)
  
  const [filter, setFilter] = useState('Tous')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  
  // Modals state
  const [showModal, setShowModal] = useState(false)
  const [editingProject, setEditingProject] = useState<any>(null)
  
  // Deletion state
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [projectToDelete, setProjectToDelete] = useState<any>(null)

  // Selection & Actions
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [activeMenu, setActiveMenu] = useState<string | null>(null)
  
  // Export state
  const [showExportMenu, setShowExportMenu] = useState(false)
  const exportMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target as Node)) {
        setShowExportMenu(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Sort
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc'|'desc' }>({ key: 'code_projet', direction: 'asc' })

  const statutMap: Record<string, string> = {
    'Tous': '',
    'En cours': 'ACTIF',
    'Planifié': 'PREPARATION',
    'Clôturé': 'CLOTURE'
  }

  // API Queries
  const { data: dashboard } = useDashboard()
  const { data: projetsData } = useProjects({ 
    limit: 10, 
    page, 
    search: search || undefined, 
    statut: filter !== 'Tous' ? statutMap[filter] : undefined 
  })
  const { data: allProjectsData } = useProjects({ limit: 9999 })
  
  const realProjects = projetsData?.data ?? []
  const allProjects = allProjectsData?.data ?? []
  const meta = projetsData?.meta

  // Mutations
  const createMutation = useCreateProject()
  
  const updateMutation = useMutation({
    mutationFn: async ({ id, dto }: { id: string, dto: Partial<FormData> }) => {
      return api.patch(`/projects/${id}`, dto)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['projects'] })
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => api.delete(`/projects/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['projects'] })
  })

  const { register, handleSubmit, formState: { errors, isSubmitting }, reset, setValue } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { devise: 'XOF' },
  })

  const onSubmit = async (values: FormData) => {
    try {
      console.log('--- DIAGNOSTIC FRONTEND ---')
      console.log('1. Début de la soumission du formulaire')
      console.log('2. Payload (Données préparées) :', values)
      
      if (editingProject) {
        console.log(`3. Mode Modification (ID: ${editingProject.id})`)
        await updateMutation.mutateAsync({ id: editingProject.id, dto: values })
      } else {
        console.log('3. Mode Création (POST /projects)')
        const res = await createMutation.mutateAsync(values)
        console.log('4. Réponse de création API :', res)
      }
      
      console.log('5. Succès ! Invalidation du cache en cours...')
      reset()
      setEditingProject(null)
      setShowModal(false)
    } catch (err: any) {
      console.error('ERREUR LORS DE LA SOUMISSION :', err)
      if (err.response) {
        console.error('Détails API (Status, Data) :', err.response.status, err.response.data)
        alert(`Erreur API : ${err.response.data?.message || 'Erreur interne'}`)
      } else {
        alert(`Erreur inattendue : ${err.message}`)
      }
    }
  }

  // Logger les erreurs de validation frontend en temps réel
  useEffect(() => {
    if (Object.keys(errors).length > 0) {
      console.error('Erreurs de validation du formulaire (Zod) bloquant la soumission :', errors)
    }
  }, [errors])

  const handleDelete = async () => {
    if (projectToDelete) {
      try {
        await deleteMutation.mutateAsync(projectToDelete.id)
        if (projectToDelete.id === activeProjectId) {
          setActiveProject(null, null)
        }
        setProjectToDelete(null)
        setShowDeleteModal(false)
        setSelectedIds(new Set())
      } catch (err: any) {
        if (err.response?.status === 409) {
          alert(`Action refusée : ${err.response.data?.message}`)
        } else {
          alert("Erreur lors de la suppression du projet.")
        }
      }
    }
  }

  const openEdit = (p: any) => {
    setEditingProject(p)
    setValue('code_projet', p.code_projet)
    setValue('nom_projet', p.nom_projet)
    setValue('bailleur_principal', p.bailleur_principal)
    setValue('date_debut', p.date_debut?.slice(0,10) || '')
    setValue('date_fin', p.date_fin?.slice(0,10) || '')
    setValue('budget_total', String(p.budget_total))
    setValue('devise', p.devise)
    setValue('description', p.description || '')
    setShowModal(true)
    setActiveMenu(null)
  }

  const openDuplicate = (p: any) => {
    setEditingProject(null)
    setValue('code_projet', '') // Sera généré par le backend
    setValue('nom_projet', `${p.nom_projet} (Copie)`)
    setValue('bailleur_principal', p.bailleur_principal)
    setValue('date_debut', p.date_debut?.slice(0,10) || '')
    setValue('date_fin', p.date_fin?.slice(0,10) || '')
    setValue('budget_total', String(p.budget_total))
    setValue('devise', p.devise)
    setValue('description', p.description || '')
    setShowModal(true)
    setActiveMenu(null)
  }

  // Formatting & Display Data
  const combinedProjects = realProjects

  const sortedProjects = useMemo(() => {
    let sortable = [...combinedProjects]
    if (sortConfig !== null) {
      sortable.sort((a, b) => {
        let aVal = (a as any)[sortConfig.key]
        let bVal = (b as any)[sortConfig.key]
        if (sortConfig.key === 'budget_total') {
          aVal = parseFloat(aVal)
          bVal = parseFloat(bVal)
        }
        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1
        return 0
      })
    }
    return sortable
  }, [combinedProjects, sortConfig])

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc'
    if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc'
    setSortConfig({ key, direction })
  }

  const toggleSelectAll = () => {
    if (selectedIds.size === sortedProjects.length) setSelectedIds(new Set())
    else setSelectedIds(new Set(sortedProjects.map(p => p.id)))
  }
  const toggleSelect = (id: string) => {
    const newSet = new Set(selectedIds)
    newSet.has(id) ? newSet.delete(id) : newSet.add(id)
    setSelectedIds(newSet)
  }

  // KPIs
  const KPIBase = allProjects
  const actifsCount = dashboard?.projets?.actifs ?? KPIBase.filter(p => p.statut === 'ACTIF').length
  const budgetTotal = dashboard?.financier?.budget_total_bac ?? KPIBase.reduce((sum, p) => sum + parseFloat(String(p.budget_total) || '0'), 0)
  const budgetStr = budgetTotal >= 1_000_000 ? `${(budgetTotal / 1_000_000).toFixed(1)} M` : formatCurrency(String(budgetTotal), 'XOF')
  const bailleursCount = new Set(KPIBase.map(p => p.bailleur_principal)).size
  const alertesCount = dashboard?.risques?.eleves ?? 0

  // Export
  const doExport = (format: 'xlsx' | 'csv' | 'pdf', scope: ExportScope) => {
    let dataToExport = []
    if (scope === 'selected') dataToExport = KPIBase.filter(p => selectedIds.has(p.id))
    else if (scope === 'all') dataToExport = KPIBase
    else dataToExport = sortedProjects

    const rows = dataToExport.map(p => ({
      Code: p.code_projet,
      Projet: p.nom_projet,
      Bailleur: p.bailleur_principal,
      Budget: p.budget_total,
      Devise: p.devise,
      Statut: p.statut
    }))

    if (rows.length === 0) return

    if (format === 'csv') {
      const headers = Object.keys(rows[0])
      const csvContent = [headers.join(';'), ...rows.map(r => Object.values(r).join(';'))].join('\n')
      const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a'); a.href = url; a.download = 'projets.csv'; a.click(); URL.revokeObjectURL(url)
    } else if (format === 'xlsx') {
      const ws = XLSX.utils.json_to_sheet(rows)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Projets')
      XLSX.writeFile(wb, 'projets.xlsx')
    } else if (format === 'pdf') {
      const doc = new jsPDF()
      doc.text('Liste des projets', 14, 15)
      autoTable(doc, {
        head: [['Code', 'Projet', 'Bailleur', 'Budget', 'Devise', 'Statut']],
        body: rows.map(r => [r.Code, r.Projet, r.Bailleur, String(r.Budget), r.Devise, r.Statut]),
        startY: 20
      })
      doc.save('projets.pdf')
    }
    setShowExportMenu(false)
  }

  return (
    <div className="p-8 max-w-[1400px] mx-auto space-y-8 h-full flex flex-col relative">
      {/* 1. En-tête de page */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#0A1628]">Gestion des projets</h1>
          <p className="text-gray-500 mt-2">Créer, suivre et filtrer les projets par bailleur, secteur, statut et budget.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative" ref={exportMenuRef}>
            <button onClick={() => setShowExportMenu(!showExportMenu)} className="bg-white border border-gray-200 text-gray-700 px-4 py-2.5 rounded-lg text-sm font-bold shadow-sm hover:bg-gray-50 transition-colors flex items-center gap-2">
              <Download size={16} /> Exporter
              <ChevronDown size={14} className={`transition-transform ${showExportMenu ? 'rotate-180' : ''}`} />
            </button>
            {showExportMenu && (
              <div className="absolute right-0 top-full mt-2 w-64 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden">
                <div className="px-3 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider bg-gray-50">Vue actuelle</div>
                <button onClick={() => doExport('xlsx', 'current')} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"><FileSpreadsheet size={14} className="text-emerald-600"/> Excel</button>
                <button onClick={() => doExport('csv', 'current')} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"><File size={14} className="text-gray-500"/> CSV</button>
                <button onClick={() => doExport('pdf', 'current')} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"><FileText size={14} className="text-red-500"/> PDF</button>
                
                <div className="px-3 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider bg-gray-50 border-t border-gray-100">Tous les projets</div>
                <button onClick={() => doExport('xlsx', 'all')} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"><FileSpreadsheet size={14} className="text-emerald-600"/> Excel</button>
                <button onClick={() => doExport('csv', 'all')} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"><File size={14} className="text-gray-500"/> CSV</button>
                <button onClick={() => doExport('pdf', 'all')} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"><FileText size={14} className="text-red-500"/> PDF</button>
                
                <div className="px-3 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider bg-gray-50 border-t border-gray-100">Sélection ({selectedIds.size})</div>
                <button onClick={() => doExport('xlsx', 'selected')} disabled={selectedIds.size === 0} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 disabled:opacity-50"><Check size={14} className="text-blue-500"/> Exporter la sélection (.xlsx)</button>
                <button onClick={() => doExport('csv', 'selected')} disabled={selectedIds.size === 0} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 disabled:opacity-50"><Check size={14} className="text-blue-500"/> Exporter la sélection (.csv)</button>
                <button onClick={() => doExport('pdf', 'selected')} disabled={selectedIds.size === 0} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 disabled:opacity-50"><Check size={14} className="text-blue-500"/> Exporter la sélection (.pdf)</button>
              </div>
            )}
          </div>
          <button onClick={() => { setEditingProject(null); reset(); setShowModal(true) }} className="bg-[#2563EB] text-white px-5 py-2.5 rounded-lg text-sm font-bold shadow-sm hover:bg-blue-700 transition-colors shrink-0">
            + Nouveau projet
          </button>
        </div>
      </div>

      {/* 2. Cartes KPI */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-200">
          <p className="text-gray-500 text-sm font-semibold mb-3">Projets actifs</p>
          <p className="text-2xl font-bold text-[#2563EB]">{actifsCount}</p>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-200">
          <p className="text-gray-500 text-sm font-semibold mb-3">Budget portefeuille</p>
          <p className="text-2xl font-bold text-[#15803D]">{budgetStr}</p>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-200">
          <p className="text-gray-500 text-sm font-semibold mb-3">Bailleurs</p>
          <p className="text-2xl font-bold text-[#15803D]">{bailleursCount}</p>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-200">
          <p className="text-gray-500 text-sm font-semibold mb-3">Projets en alerte</p>
          <p className="text-2xl font-bold text-[#DC2626]">{alertesCount}</p>
        </div>
      </div>

      {/* 3. Recherche et Filtres */}
      <div className="flex flex-col lg:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Recherche projet, bailleur, secteur..."
            className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 w-full lg:w-auto">
          {['Tous', 'En cours', 'Planifié', 'Clôturé'].map(f => {
            let activeBg = 'white'
            let textColor = '#6B7280'
            let isActive = filter === f

            if (isActive) {
              textColor = 'white'
              if (f === 'Tous') activeBg = '#2563EB'
              else if (f === 'En cours') activeBg = '#15803D'
              else activeBg = '#6B7280'
            }

            return (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className="px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors border border-transparent"
                style={{ backgroundColor: activeBg, color: textColor, border: isActive ? 'none' : '1px solid #E5E7EB' }}
              >
                {f}
              </button>
            )
          })}
        </div>
      </div>

      {/* 4. Tableau des projets */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-visible flex-1 flex flex-col">
        <div className="overflow-x-auto flex-1 pb-16">
          <table className="w-full text-sm text-left">
            <thead className="bg-[#0A1628] text-white">
              <tr>
                <th className="w-12 px-6 py-4">
                  <input type="checkbox" checked={selectedIds.size > 0 && selectedIds.size === sortedProjects.length} onChange={toggleSelectAll} className="w-4 h-4 rounded border-gray-300 text-[#2563EB] focus:ring-[#2563EB] cursor-pointer accent-blue-600" />
                </th>
                <th className="px-6 py-4 font-bold cursor-pointer hover:bg-white/5" onClick={() => handleSort('code_projet')}>
                  Code {sortConfig.key === 'code_projet' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th className="px-6 py-4 font-bold cursor-pointer hover:bg-white/5" onClick={() => handleSort('nom_projet')}>
                  Projet {sortConfig.key === 'nom_projet' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th className="px-6 py-4 font-bold cursor-pointer hover:bg-white/5" onClick={() => handleSort('bailleur_principal')}>
                  Bailleur {sortConfig.key === 'bailleur_principal' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th className="px-6 py-4 font-bold cursor-pointer hover:bg-white/5" onClick={() => handleSort('budget_total')}>
                  Budget {sortConfig.key === 'budget_total' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th className="px-6 py-4 font-bold cursor-pointer hover:bg-white/5" onClick={() => handleSort('statut')}>
                  Statut {sortConfig.key === 'statut' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th className="px-6 py-4 font-bold">Avancement</th>
                <th className="px-6 py-4 font-bold text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sortedProjects.map(p => {
                const isChecked = selectedIds.has(p.id)
                const avancement = formatPercent(p.taux_avancement ?? 0)
                const displayStatut = p.statut === 'ACTIF' ? 'En cours' : p.statut === 'PREPARATION' ? 'Planifié' : p.statut === 'SUSPENDU' ? 'En alerte' : p.statut
                return (
                  <tr key={p.id} onClick={() => { setActiveProject(p.id, p.nom_projet); navigate(`/projects/${p.id}/dashboard`); }} className={`hover:bg-gray-50 transition-colors cursor-pointer group ${isChecked ? 'bg-blue-50/50' : ''}`}>
                    <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                      <input type="checkbox" checked={isChecked} onChange={() => toggleSelect(p.id)} className="w-4 h-4 rounded border-gray-300 text-[#2563EB] focus:ring-[#2563EB] cursor-pointer accent-blue-600" />
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-900">{p.code_projet}</td>
                    <td className="px-6 py-4 font-medium text-gray-900">{p.nom_projet}</td>
                    <td className="px-6 py-4 text-gray-600">{p.bailleur_principal}</td>
                    <td className="px-6 py-4 text-gray-900 font-mono">{formatCurrency(String(p.budget_total), p.devise)}</td>
                    <td className="px-6 py-4 text-gray-600">{displayStatut}</td>
                    <td className="px-6 py-4 text-gray-600">{avancement}</td>
                    <td className="px-6 py-4 text-center relative" onClick={(e) => e.stopPropagation()}>
                      <button onClick={() => setActiveMenu(activeMenu === p.id ? null : p.id)} className="p-1.5 text-gray-400 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors">
                        <MoreVertical size={16} />
                      </button>
                      {activeMenu === p.id && (
                        <div className="absolute right-12 top-8 bg-white border border-gray-200 shadow-xl rounded-xl w-36 py-1 z-20 text-left">
                          <button onClick={() => { setActiveProject(p.id, p.nom_projet); navigate(`/projects/${p.id}/dashboard`); }} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Voir</button>
                          <button onClick={() => openEdit(p)} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Modifier</button>
                          <button onClick={() => openDuplicate(p)} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Dupliquer</button>
                          <div className="my-1 border-t border-gray-100"></div>
                          <button onClick={() => { setProjectToDelete(p); setShowDeleteModal(true); setActiveMenu(null) }} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 font-medium">Supprimer</button>
                        </div>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {meta && meta.totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-3 border-t border-gray-100 bg-gray-50 rounded-b-2xl mt-auto">
            <span className="text-sm text-gray-500 font-medium">{meta.total} projets • Page {page} sur {meta.totalPages}</span>
            <div className="flex gap-2">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-600 font-semibold hover:bg-gray-100 disabled:opacity-50 transition-colors">Précédent</button>
              <button disabled={page === meta.totalPages} onClick={() => setPage(p => p + 1)} className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-600 font-semibold hover:bg-gray-100 disabled:opacity-50 transition-colors">Suivant</button>
            </div>
          </div>
        )}
      </div>

      {/* 5. Bande interaction */}
      <div className="bg-[#EEF2FF] rounded-xl p-4 border border-blue-100 mt-auto">
        <p className="text-gray-700 text-sm text-center">
          Interaction : cliquer sur une ligne ouvre le détail du projet et active tous les modules liés.
        </p>
      </div>

      {/* ── Modal Création/Edition ─────────────────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white border border-gray-200 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
              <h3 className="text-lg font-bold text-[#0A1628]">{editingProject ? 'Modifier le projet' : 'Nouveau Projet'}</h3>
              <button onClick={() => { setShowModal(false); setEditingProject(null); reset() }} className="text-gray-500 hover:text-gray-900 transition-colors">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-600 font-bold mb-1.5 block uppercase tracking-wide">Code projet</label>
                  <input {...register('code_projet')} disabled placeholder="Généré automatiquement" className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-gray-100 text-gray-500 cursor-not-allowed" />
                  {errors.code_projet && <p className="text-red-500 text-xs mt-1">{errors.code_projet.message}</p>}
                </div>
                <div>
                  <label className="text-xs text-gray-600 font-bold mb-1.5 block uppercase tracking-wide">Devise</label>
                  <select {...register('devise')} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]">
                    <option value="XOF">XOF (FCFA)</option>
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-600 font-bold mb-1.5 block uppercase tracking-wide">Nom du projet *</label>
                <input {...register('nom_projet')} placeholder="Ex: Eau potable rural" className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]" />
                {errors.nom_projet && <p className="text-red-500 text-xs mt-1">{errors.nom_projet.message}</p>}
              </div>
              <div>
                <label className="text-xs text-gray-600 font-bold mb-1.5 block uppercase tracking-wide">Bailleur principal *</label>
                <input {...register('bailleur_principal')} placeholder="Ex: Banque X" className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]" />
                {errors.bailleur_principal && <p className="text-red-500 text-xs mt-1">{errors.bailleur_principal.message}</p>}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-600 font-bold mb-1.5 block uppercase tracking-wide">Date début *</label>
                  <input {...register('date_debut')} type="date" className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]" />
                  {errors.date_debut && <p className="text-red-500 text-xs mt-1">{errors.date_debut.message}</p>}
                </div>
                <div>
                  <label className="text-xs text-gray-600 font-bold mb-1.5 block uppercase tracking-wide">Date fin *</label>
                  <input {...register('date_fin')} type="date" className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]" />
                  {errors.date_fin && <p className="text-red-500 text-xs mt-1">{errors.date_fin.message}</p>}
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-600 font-bold mb-1.5 block uppercase tracking-wide">Budget total *</label>
                <input {...register('budget_total')} placeholder="Ex: 500000" className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]" />
                {errors.budget_total && <p className="text-red-500 text-xs mt-1">{errors.budget_total.message}</p>}
              </div>
              <div>
                <label className="text-xs text-gray-600 font-bold mb-1.5 block uppercase tracking-wide">Description</label>
                <textarea {...register('description')} rows={2} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]" />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button type="button" onClick={() => { setShowModal(false); setEditingProject(null); reset() }} className="px-5 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                  Annuler
                </button>
                <button type="submit" disabled={isSubmitting || updateMutation.isPending || createMutation.isPending} className="px-5 py-2.5 text-sm font-bold text-white bg-[#2563EB] hover:bg-blue-700 rounded-lg flex items-center gap-2 transition-colors">
                  {(isSubmitting || updateMutation.isPending || createMutation.isPending) && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                  {editingProject ? 'Enregistrer' : 'Créer le projet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal Suppression ─────────────────────────────────────────── */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white border border-gray-200 rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4 text-red-600">
              <X size={24} />
            </div>
            <h3 className="text-lg font-bold text-[#0A1628] mb-2">Supprimer le projet ?</h3>
            <p className="text-gray-500 text-sm mb-6">
              Êtes-vous sûr de vouloir supprimer définitivement le projet <strong className="text-gray-800">{projectToDelete?.code_projet}</strong> ? Cette action est irréversible.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteModal(false)} className="flex-1 px-4 py-2.5 text-sm font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
                Annuler
              </button>
              <button onClick={handleDelete} disabled={deleteMutation.isPending} className="flex-1 px-4 py-2.5 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors flex items-center justify-center gap-2">
                {deleteMutation.isPending && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
