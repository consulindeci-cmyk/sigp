import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { Plus, Loader2, Trash2 } from 'lucide-react'
import { PageHeader } from '@/components/layout/AppShell'
import { useRisks, useCreateRisk, useUpdateRisk, useDeleteRisk } from '@/hooks/useRisks'
import { useProject } from '@/hooks/useProjects'
import type { Risque } from '@/types'

const CATEGORIES = ['FINANCIER', 'TECHNIQUE', 'OPERATIONNEL', 'STRATEGIQUE', 'ENVIRONNEMENTAL']

export default function RisksPage() {
  const { id: projectId = '' } = useParams()
  const { data: project } = useProject(projectId)
  const { data: risksData, isLoading } = useRisks(projectId)
  const createMutation = useCreateRisk(projectId)
  const updateMutation = useUpdateRisk(projectId)
  const deleteMutation = useDeleteRisk(projectId)

  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState<Partial<Risque>>({
    categorie: 'FINANCIER',
    description: '',
    probabilite: 1,
    impact: 1,
    plan_mitigation: '',
    statut: 'IDENTIFIE'
  })

  const risques = risksData?.data ?? []

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    const p = Number(formData.probabilite) || 1
    const i = Number(formData.impact) || 1
    await createMutation.mutateAsync({
      ...formData,
      probabilite: p,
      impact: i,
      criticite: p * i,
      niveau_criticite: (p * i) <= 2 ? 'FAIBLE' : (p * i) <= 4 ? 'MODERE' : 'CRITIQUE'
    })
    setShowModal(false)
    setFormData({ categorie: 'FINANCIER', description: '', probabilite: 1, impact: 1, plan_mitigation: '', statut: 'IDENTIFIE' })
  }

  const handleUpdate = (id: string, risque: any, field: keyof Risque, value: any) => {
    const updated = { ...risque, [field]: value }
    const p = Number(updated.probabilite) || 1
    const i = Number(updated.impact) || 1
    const criticite = p * i
    const niveau_criticite = criticite <= 2 ? 'FAIBLE' : criticite <= 4 ? 'MODERE' : 'CRITIQUE'
    updateMutation.mutate({ id, [field]: value, probabilite: p, impact: i, criticite, niveau_criticite })
  }

  const getCriticiteColor = (c: number) => {
    if (c <= 2) return 'bg-sigp-success/20 text-sigp-success'
    if (c <= 4) return 'bg-sigp-warning/20 text-sigp-warning'
    return 'bg-sigp-error/20 text-sigp-error'
  }

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title={`Matrice des Risques — ${project?.code_projet ?? '...'}`}
        subtitle="Identification et suivi des risques (P × I)"
        actions={
          <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-1.5 text-xs">
            <Plus size={13} /> Ajouter un Risque
          </button>
        }
      />

      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="animate-spin text-sigp-muted" /></div>
      ) : (
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="bg-navy-800 border border-navy-500 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="excel-table min-w-[1000px]">
                <thead>
                  <tr>
                    <th className="w-32">Catégorie</th>
                    <th className="w-1/4">Description</th>
                    <th className="text-center w-24">Probabilité (1-3)</th>
                    <th className="text-center w-24">Impact (1-3)</th>
                    <th className="text-center w-24">Criticité</th>
                    <th className="w-1/4">Plan de Mitigation</th>
                    <th className="w-24">Statut</th>
                    <th className="w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {risques.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-8 text-sigp-muted">Aucun risque identifié.</td>
                    </tr>
                  ) : (
                    risques.map((r: any) => {
                      const criticite = (r.probabilite || 1) * (r.impact || 1)
                      return (
                        <tr key={r.id}>
                          <td>
                            <select
                              value={r.categorie}
                              onChange={(e) => handleUpdate(r.id, r, 'categorie', e.target.value)}
                              className="bg-transparent border-none outline-none text-xs w-full font-bold"
                            >
                              {CATEGORIES.map(c => <option key={c} value={c} className="bg-navy-800 text-white">{c}</option>)}
                            </select>
                          </td>
                          <td className="whitespace-normal">
                            <textarea
                              rows={2}
                              value={r.description}
                              onChange={(e) => handleUpdate(r.id, r, 'description', e.target.value)}
                              className="bg-transparent border-none outline-none w-full resize-none text-xs"
                            />
                          </td>
                          <td className="text-center">
                            <select
                              value={r.probabilite}
                              onChange={(e) => handleUpdate(r.id, r, 'probabilite', Number(e.target.value))}
                              className="bg-transparent border-none outline-none text-center w-full font-mono font-bold"
                            >
                              <option value={1} className="bg-navy-800 text-white">1 - Faible</option>
                              <option value={2} className="bg-navy-800 text-white">2 - Moyen</option>
                              <option value={3} className="bg-navy-800 text-white">3 - Fort</option>
                            </select>
                          </td>
                          <td className="text-center">
                            <select
                              value={r.impact}
                              onChange={(e) => handleUpdate(r.id, r, 'impact', Number(e.target.value))}
                              className="bg-transparent border-none outline-none text-center w-full font-mono font-bold"
                            >
                              <option value={1} className="bg-navy-800 text-white">1 - Mineur</option>
                              <option value={2} className="bg-navy-800 text-white">2 - Modéré</option>
                              <option value={3} className="bg-navy-800 text-white">3 - Majeur</option>
                            </select>
                          </td>
                          <td className="text-center font-mono font-bold">
                            <span className={`px-2 py-1 rounded-md ${getCriticiteColor(criticite)}`}>
                              {criticite}
                            </span>
                          </td>
                          <td className="whitespace-normal">
                            <textarea
                              rows={2}
                              value={r.plan_mitigation || ''}
                              onChange={(e) => handleUpdate(r.id, r, 'plan_mitigation', e.target.value)}
                              className="bg-transparent border-none outline-none w-full resize-none text-xs text-sigp-muted"
                            />
                          </td>
                          <td>
                            <select
                              value={r.statut}
                              onChange={(e) => handleUpdate(r.id, r, 'statut', e.target.value)}
                              className="bg-transparent border-none outline-none text-xs w-full font-bold"
                            >
                              <option value="IDENTIFIE" className="bg-navy-800 text-white">Identifié</option>
                              <option value="EN_COURS_ATTENUATION" className="bg-navy-800 text-white">En cours</option>
                              <option value="RESIDU" className="bg-navy-800 text-white">Résidu</option>
                              <option value="CLOS" className="bg-navy-800 text-white">Clos</option>
                            </select>
                          </td>
                          <td className="text-center">
                            <button onClick={() => deleteMutation.mutate(r.id)} className="text-sigp-muted hover:text-sigp-red transition-colors">
                              <Trash2 size={13} />
                            </button>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-navy-800 border border-navy-500 rounded-xl w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-navy-500">
              <h3 className="text-sm font-semibold text-sigp-text">Déclarer un Nouveau Risque</h3>
              <button onClick={() => setShowModal(false)} className="text-sigp-muted hover:text-sigp-text"><Plus className="rotate-45" size={16} /></button>
            </div>
            <form onSubmit={handleCreate} className="p-5 space-y-4">
              <div>
                <label className="text-xs text-sigp-muted mb-1 block">Catégorie</label>
                <select value={formData.categorie} onChange={e => setFormData({ ...formData, categorie: e.target.value })} className="sigp-input">
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-sigp-muted mb-1 block">Description *</label>
                <textarea required rows={2} value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className="sigp-input resize-none" placeholder="Description du risque..." />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-sigp-muted mb-1 block">Probabilité (1-3)</label>
                  <select value={formData.probabilite} onChange={e => setFormData({ ...formData, probabilite: Number(e.target.value) })} className="sigp-input">
                    <option value={1}>1 - Faible</option>
                    <option value={2}>2 - Moyen</option>
                    <option value={3}>3 - Fort</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-sigp-muted mb-1 block">Impact (1-3)</label>
                  <select value={formData.impact} onChange={e => setFormData({ ...formData, impact: Number(e.target.value) })} className="sigp-input">
                    <option value={1}>1 - Mineur</option>
                    <option value={2}>2 - Modéré</option>
                    <option value={3}>3 - Majeur</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs text-sigp-muted mb-1 block">Plan de mitigation</label>
                <textarea rows={2} value={formData.plan_mitigation} onChange={e => setFormData({ ...formData, plan_mitigation: e.target.value })} className="sigp-input resize-none" placeholder="Actions prévues..." />
              </div>
              <div className="bg-navy-900 p-3 rounded-lg flex justify-between items-center">
                <span className="text-xs text-sigp-muted">Criticité (P × I) :</span>
                <span className={`px-2 py-1 rounded-md text-xs font-bold ${getCriticiteColor((formData.probabilite || 1) * (formData.impact || 1))}`}>
                  {(formData.probabilite || 1) * (formData.impact || 1)}
                </span>
              </div>
              
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-ghost">Annuler</button>
                <button type="submit" disabled={createMutation.isPending} className="btn-primary flex items-center gap-2">
                  {createMutation.isPending && <Loader2 size={14} className="animate-spin" />}
                  Ajouter
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
