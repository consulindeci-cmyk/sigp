import React, { useState, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { Plus, Search, FileText, Download, MoreHorizontal, Eye, Edit, Trash2, ArrowUpDown, Loader2, AlertCircle } from 'lucide-react'
import { useLogframe, useCreateLogframe, useUpdateLogframe, useDeleteLogframe } from '@/hooks/useLogframe'
import { useProject } from '@/hooks/useProjects'
import { useUIStore } from '@/stores/uiStore'
import type { CadreLogique } from '@/types'
import jsPDF from 'jspdf'
import 'jspdf-autotable'
import * as XLSX from 'xlsx'

const NIVEAUX = ['IMPACT', 'EFFET', 'RESULTAT', 'ACTIVITE']

export default function LogframePage() {
  const { id: urlProjectId } = useParams()
  const { activeProjectId } = useUIStore()
  
  // 1. Détermination stricte du projectId
  const resolvedProjectId = urlProjectId || activeProjectId || ''

  const { data: project } = useProject(resolvedProjectId)
  
  // React Query hooks
  const { data: logframeData, isLoading } = useLogframe(resolvedProjectId)
  const createMutation = useCreateLogframe(resolvedProjectId)
  const updateMutation = useUpdateLogframe(resolvedProjectId)
  const deleteMutation = useDeleteLogframe(resolvedProjectId)

  const elements = logframeData?.data ?? []

  // States
  const [searchTerm, setSearchTerm] = useState('')
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>(null)
  
  // Modals & Errors
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('create')
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<Partial<CadreLogique> | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Form State
  const [formData, setFormData] = useState<Partial<CadreLogique>>({
    niveau_intervention: 'RESULTAT',
    indicateur: '',
    valeur_reference: '',
    cible: '',
    source_verification: '',
    hypotheses: ''
  })

  const [activeMenu, setActiveMenu] = useState<string | null>(null)

  // Blocage : Si aucun projet n'est actif, afficher le message et empêcher l'utilisation
  if (!resolvedProjectId) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-[#F5F6F8] p-6 h-full">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200 text-center max-w-md">
          <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle size={32} />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Aucun projet sélectionné</h2>
          <p className="text-gray-500 mb-6">
            Veuillez sélectionner un projet avant d'utiliser le Cadre logique.
          </p>
        </div>
      </div>
    )
  }

  // Filter & Sort
  const filteredAndSorted = useMemo(() => {
    let result = [...elements]

    // Search
    if (searchTerm) {
      const lower = searchTerm.toLowerCase()
      result = result.filter(r => 
        r.indicateur?.toLowerCase().includes(lower) || 
        r.niveau_intervention?.toLowerCase().includes(lower) ||
        r.source_verification?.toLowerCase().includes(lower) ||
        r.hypotheses?.toLowerCase().includes(lower)
      )
    }

    // Sort
    if (sortConfig) {
      result.sort((a, b) => {
        const valA = (a as any)[sortConfig.key] || ''
        const valB = (b as any)[sortConfig.key] || ''
        if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1
        if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1
        return 0
      })
    }

    return result
  }, [elements, searchTerm, sortConfig])

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc'
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc'
    setSortConfig({ key, direction })
  }

  // Actions
  const openCreateModal = () => {
    setModalMode('create')
    setFormData({ niveau_intervention: 'RESULTAT', indicateur: '', valeur_reference: '', cible: '', source_verification: '', hypotheses: '' })
    setErrorMessage(null)
    setIsModalOpen(true)
  }

  const openEditModal = (item: CadreLogique) => {
    setModalMode('edit')
    setFormData(item)
    setErrorMessage(null)
    setIsModalOpen(true)
    setActiveMenu(null)
  }

  const openViewModal = (item: CadreLogique) => {
    setModalMode('view')
    setFormData(item)
    setErrorMessage(null)
    setIsModalOpen(true)
    setActiveMenu(null)
  }

  const openDeleteModal = (item: CadreLogique) => {
    setSelectedItem(item)
    setErrorMessage(null)
    setIsDeleteModalOpen(true)
    setActiveMenu(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)
    try {
      if (modalMode === 'create') {
        await createMutation.mutateAsync(formData)
      } else if (modalMode === 'edit' && formData.id) {
        await updateMutation.mutateAsync({ id: formData.id, ...formData })
      }
      setIsModalOpen(false)
    } catch (error: any) {
      console.error('Erreur lors de la mutation:', error)
      setErrorMessage(error?.response?.data?.message || error?.message || 'Une erreur est survenue lors de l\'enregistrement.')
    }
  }

  const handleDelete = async () => {
    if (selectedItem?.id) {
      setErrorMessage(null)
      try {
        await deleteMutation.mutateAsync(selectedItem.id)
        setIsDeleteModalOpen(false)
        setSelectedItem(null)
      } catch (error: any) {
        console.error('Erreur lors de la suppression:', error)
        setErrorMessage(error?.response?.data?.message || error?.message || 'Une erreur est survenue lors de la suppression.')
      }
    }
  }

  // Exports
  const exportPDF = () => {
    const doc = new jsPDF()
    doc.text(`Cadre Logique - Projet ${project?.code_projet ?? ''}`, 14, 15)
    
    const tableData = filteredAndSorted.map(row => [
      row.niveau_intervention,
      row.indicateur,
      row.valeur_reference,
      row.cible,
      row.source_verification,
      row.hypotheses
    ])

    ;(doc as any).autoTable({
      startY: 20,
      head: [['Niveau', 'Indicateur', 'Baseline', 'Cible', 'Vérification', 'Hypothèses']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [10, 22, 40] },
      styles: { fontSize: 8 }
    })
    
    doc.save(`Cadre_Logique_${project?.code_projet ?? 'Export'}.pdf`)
  }

  const exportExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(filteredAndSorted.map(row => ({
      Niveau: row.niveau_intervention,
      Indicateur: row.indicateur,
      Baseline: row.valeur_reference,
      Cible: row.cible,
      Vérification: row.source_verification,
      'Hypothèses/Risques': row.hypotheses
    })))
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Cadre Logique")
    XLSX.writeFile(workbook, `Cadre_Logique_${project?.code_projet ?? 'Export'}.xlsx`)
  }

  return (
    <div className="flex-1 overflow-auto bg-[#F5F6F8] p-6">
      
      {/* 1. En-tête de page */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Cadre logique {project?.code_projet ? `- ${project.code_projet}` : ''}</h1>
          <p className="text-[#6B7280] text-sm mt-1">
            Matrice résultats : objectifs, indicateurs, baseline, cibles, sources de vérification et hypothèses.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={exportPDF} className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-3 py-2 rounded-lg text-sm font-semibold shadow-sm transition-colors flex items-center gap-2">
            <FileText size={16} /> PDF
          </button>
          <button onClick={exportExcel} className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-3 py-2 rounded-lg text-sm font-semibold shadow-sm transition-colors flex items-center gap-2">
            <Download size={16} /> Excel
          </button>
          <button onClick={openCreateModal} className="bg-[#2563EB] hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm transition-colors flex items-center gap-2">
            <Plus size={16} /> Ajouter niveau
          </button>
        </div>
      </div>

      {/* Barre d'outils (Recherche) */}
      <div className="mb-4 flex items-center bg-white p-2 rounded-lg shadow-sm border border-gray-200 w-full md:w-1/3">
        <Search size={18} className="text-gray-400 ml-2" />
        <input 
          type="text" 
          placeholder="Rechercher un indicateur, un niveau..." 
          className="w-full pl-2 pr-4 py-1 text-sm outline-none bg-transparent"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* 2. Tableau matrice */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mb-6 min-h-[300px]">
        {isLoading ? (
          <div className="flex justify-center items-center h-48">
            <Loader2 className="animate-spin text-[#2563EB]" size={32} />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-[#0A1628] text-white">
                  <th className="py-3 px-4 text-sm font-bold cursor-pointer select-none" onClick={() => handleSort('niveau_intervention')}>
                    <div className="flex items-center gap-1">Niveau <ArrowUpDown size={14} className="opacity-50" /></div>
                  </th>
                  <th className="py-3 px-4 text-sm font-bold cursor-pointer select-none" onClick={() => handleSort('indicateur')}>
                    <div className="flex items-center gap-1">Indicateur <ArrowUpDown size={14} className="opacity-50" /></div>
                  </th>
                  <th className="py-3 px-4 text-sm font-bold cursor-pointer select-none" onClick={() => handleSort('valeur_reference')}>
                    <div className="flex items-center gap-1">Baseline <ArrowUpDown size={14} className="opacity-50" /></div>
                  </th>
                  <th className="py-3 px-4 text-sm font-bold cursor-pointer select-none" onClick={() => handleSort('cible')}>
                    <div className="flex items-center gap-1">Cible <ArrowUpDown size={14} className="opacity-50" /></div>
                  </th>
                  <th className="py-3 px-4 text-sm font-bold">Vérification</th>
                  <th className="py-3 px-4 text-sm font-bold">Hypothèses / risques</th>
                  <th className="py-3 px-4 text-sm font-bold text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 relative">
                {filteredAndSorted.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-gray-500 text-sm">Aucune donnée trouvée.</td>
                  </tr>
                ) : (
                  filteredAndSorted.map((row: any) => (
                    <tr key={row.id} className="bg-white hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4 text-sm text-gray-900 font-medium whitespace-nowrap">{row.niveau_intervention}</td>
                      <td className="py-3 px-4 text-sm text-[#6B7280]">{row.indicateur}</td>
                      <td className="py-3 px-4 text-sm text-[#6B7280]">{row.valeur_reference || '-'}</td>
                      <td className="py-3 px-4 text-sm text-[#6B7280]">{row.cible || '-'}</td>
                      <td className="py-3 px-4 text-sm text-[#6B7280]">{row.source_verification || '-'}</td>
                      <td className="py-3 px-4 text-sm text-[#6B7280]">{row.hypotheses || '-'}</td>
                      <td className="py-3 px-4 text-sm text-center relative">
                        <button 
                          onClick={() => setActiveMenu(activeMenu === row.id ? null : row.id)}
                          className="p-1.5 hover:bg-gray-200 rounded text-gray-500 transition-colors"
                        >
                          <MoreHorizontal size={18} />
                        </button>

                        {/* Menu contextuel flottant */}
                        {activeMenu === row.id && (
                          <div className="absolute right-10 top-2 mt-2 w-36 bg-white rounded-lg shadow-xl border border-gray-100 z-50 overflow-hidden text-left">
                            <div className="absolute -right-2 -top-2 w-full h-full" onMouseLeave={() => setActiveMenu(null)} />
                            <button onClick={() => openViewModal(row)} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                              <Eye size={14} /> Voir
                            </button>
                            <button onClick={() => openEditModal(row)} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                              <Edit size={14} /> Modifier
                            </button>
                            <div className="h-px bg-gray-100 my-1"></div>
                            <button onClick={() => openDeleteModal(row)} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 font-medium">
                              <Trash2 size={14} /> Supprimer
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 3. Deux cartes côte à côte */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-sm p-6 flex flex-col gap-2">
          <h3 className="text-gray-900 font-bold text-base">Aide à la saisie</h3>
          <p className="text-[#6B7280] text-sm leading-relaxed">
            Listes contrôlées pour niveaux, sources de vérification et hypothèses. Les indicateurs peuvent être liés au tableau de bord.
          </p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm p-6 flex flex-col gap-2">
          <h3 className="text-gray-900 font-bold text-base">Vue bailleur</h3>
          <p className="text-[#6B7280] text-sm leading-relaxed">
            Export direct de la matrice en PDF / Excel pour revue institutionnelle et reporting.
          </p>
        </div>
      </div>

      {/* Modale Formulaire (Créer / Modifier / Voir) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
              <h3 className="font-bold text-lg text-gray-900">
                {modalMode === 'create' ? 'Nouvel Indicateur' : modalMode === 'edit' ? 'Modifier l\'indicateur' : 'Détails de l\'indicateur'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <Plus className="rotate-45" size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6">
              {errorMessage && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm flex items-start gap-2">
                  <AlertCircle size={16} className="mt-0.5 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Niveau d'intervention *</label>
                  <select 
                    required disabled={modalMode === 'view'}
                    value={formData.niveau_intervention} 
                    onChange={e => setFormData({...formData, niveau_intervention: e.target.value as any})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                  >
                    {NIVEAUX.map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Indicateur (IOV) *</label>
                  <textarea 
                    required disabled={modalMode === 'view'} rows={2}
                    value={formData.indicateur} 
                    onChange={e => setFormData({...formData, indicateur: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Baseline (Référence)</label>
                  <input 
                    type="text" disabled={modalMode === 'view'}
                    value={formData.valeur_reference || ''} 
                    onChange={e => setFormData({...formData, valeur_reference: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cible</label>
                  <input 
                    type="text" disabled={modalMode === 'view'}
                    value={formData.cible || ''} 
                    onChange={e => setFormData({...formData, cible: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Source de Vérification</label>
                  <input 
                    type="text" disabled={modalMode === 'view'}
                    value={formData.source_verification || ''} 
                    onChange={e => setFormData({...formData, source_verification: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Hypothèses / risques</label>
                  <input 
                    type="text" disabled={modalMode === 'view'}
                    value={formData.hypotheses || ''} 
                    onChange={e => setFormData({...formData, hypotheses: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors">
                  {modalMode === 'view' ? 'Fermer' : 'Annuler'}
                </button>
                {modalMode !== 'view' && (
                  <button type="submit" disabled={createMutation.isPending || updateMutation.isPending} className="bg-[#2563EB] hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm transition-colors flex items-center gap-2">
                    {(createMutation.isPending || updateMutation.isPending) && <Loader2 size={16} className="animate-spin" />}
                    Enregistrer
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modale de Suppression */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4">
              <Trash2 size={24} />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Confirmer la suppression</h3>
            <p className="text-gray-500 text-sm mb-6">
              Êtes-vous sûr de vouloir supprimer l'indicateur "{selectedItem?.indicateur}" ? Cette action est irréversible.
            </p>

            {errorMessage && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm flex items-start gap-2 text-left">
                <AlertCircle size={16} className="mt-0.5 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div className="flex items-center justify-center gap-3">
              <button onClick={() => setIsDeleteModalOpen(false)} className="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors">
                Annuler
              </button>
              <button onClick={handleDelete} disabled={deleteMutation.isPending} className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm transition-colors flex items-center gap-2">
                {deleteMutation.isPending && <Loader2 size={16} className="animate-spin" />}
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
