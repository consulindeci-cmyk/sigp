import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { Plus, Loader2, Trash2 } from 'lucide-react'
import { PageHeader } from '@/components/layout/AppShell'
import { usePTBA, useCreatePTBA, useUpdatePTBA, useDeletePTBA } from '@/hooks/usePTBA'
import { useProject } from '@/hooks/useProjects'
import type { PTBA } from '@/types'

export default function PTBAPage() {
  const { id: projectId = '' } = useParams()
  const { data: project } = useProject(projectId)
  const { data: ptbaData, isLoading } = usePTBA(projectId)
  const createMutation = useCreatePTBA(projectId)
  const updateMutation = useUpdatePTBA(projectId)
  const deleteMutation = useDeletePTBA(projectId)

  const lignes = ptbaData?.data ?? []

  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState<Partial<PTBA>>({
    code_activite: '', composante: '', activite: '', q1: 0, q2: 0, q3: 0, q4: 0, statut: 'PLANIFIE'
  })

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    const budgetPrevu = (Number(formData.q1) || 0) + (Number(formData.q2) || 0) + (Number(formData.q3) || 0) + (Number(formData.q4) || 0)
    await createMutation.mutateAsync({
      ...formData,
      budget_prevu: budgetPrevu
    })
    setShowModal(false)
    setFormData({ code_activite: '', composante: '', activite: '', q1: 0, q2: 0, q3: 0, q4: 0, statut: 'PLANIFIE' })
  }

  const handleUpdate = (id: string, ligne: any, field: keyof PTBA, value: any) => {
    const updated = { ...ligne, [field]: value }
    const q1 = Number(updated.q1) || 0
    const q2 = Number(updated.q2) || 0
    const q3 = Number(updated.q3) || 0
    const q4 = Number(updated.q4) || 0
    const total = q1 + q2 + q3 + q4

    updateMutation.mutate({ id, [field]: value, budget_prevu: total })
  }

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title={`PTBA — ${project?.code_projet ?? '...'}`}
        subtitle="Plan de Travail et Budget Annuel"
        actions={
          <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-1.5 text-xs">
            <Plus size={13} /> Ajouter Activité
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
                    <th className="w-20">Code</th>
                    <th className="w-48">Composante</th>
                    <th className="w-1/4">Activité</th>
                    <th className="text-right">Q1</th>
                    <th className="text-right">Q2</th>
                    <th className="text-right">Q3</th>
                    <th className="text-right">Q4</th>
                    <th className="text-right bg-navy-900">Total ({project?.devise})</th>
                    <th className="w-24">Statut</th>
                    <th className="w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {lignes.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="text-center py-8 text-sigp-muted">Aucune activité dans le PTBA.</td>
                    </tr>
                  ) : (
                    lignes.map((l: any) => {
                      const totalRow = (Number(l.q1)||0) + (Number(l.q2)||0) + (Number(l.q3)||0) + (Number(l.q4)||0)
                      return (
                        <tr key={l.id}>
                          <td className="font-mono text-sigp-blue font-medium">
                            <input
                              type="text"
                              value={l.code_activite}
                              onChange={(e) => handleUpdate(l.id, l, 'code_activite', e.target.value)}
                              className="bg-transparent border-none outline-none w-full"
                            />
                          </td>
                          <td className="font-medium">
                            <input
                              type="text"
                              value={l.composante}
                              onChange={(e) => handleUpdate(l.id, l, 'composante', e.target.value)}
                              className="bg-transparent border-none outline-none w-full"
                            />
                          </td>
                          <td className="whitespace-normal">
                            <textarea
                              rows={1}
                              value={l.activite}
                              onChange={(e) => handleUpdate(l.id, l, 'activite', e.target.value)}
                              className="bg-transparent border-none outline-none w-full resize-none text-xs"
                            />
                          </td>
                          {[1, 2, 3, 4].map((q) => (
                            <td key={q} className="text-right font-mono">
                              <input
                                type="number"
                                min={0}
                                value={l[`q${q}`]}
                                onChange={(e) => handleUpdate(l.id, l, `q${q}` as keyof PTBA, parseFloat(e.target.value) || 0)}
                                className="bg-transparent border-none outline-none w-full text-right"
                              />
                            </td>
                          ))}
                          <td className="text-right font-mono font-bold bg-navy-900/50 text-sigp-yellow">
                            {new Intl.NumberFormat('fr-FR').format(totalRow)}
                          </td>
                          <td>
                            <select
                              value={l.statut}
                              onChange={(e) => handleUpdate(l.id, l, 'statut', e.target.value)}
                              className="bg-transparent border-none outline-none text-xs w-full font-bold"
                            >
                              <option value="PLANIFIE">Planifié</option>
                              <option value="EN_COURS">En cours</option>
                              <option value="TERMINE">Terminé</option>
                              <option value="SUSPENDU">Suspendu</option>
                            </select>
                          </td>
                          <td className="text-center">
                            <button onClick={() => deleteMutation.mutate(l.id)} className="text-sigp-muted hover:text-sigp-red transition-colors">
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
              <h3 className="text-sm font-semibold text-sigp-text">Ajouter une Activité au PTBA</h3>
              <button onClick={() => setShowModal(false)} className="text-sigp-muted hover:text-sigp-text"><Plus className="rotate-45" size={16} /></button>
            </div>
            <form onSubmit={handleCreate} className="p-5 space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1">
                  <label className="text-xs text-sigp-muted mb-1 block">Code *</label>
                  <input required value={formData.code_activite} onChange={e => setFormData({ ...formData, code_activite: e.target.value })} className="sigp-input" placeholder="A.1" />
                </div>
                <div className="col-span-2">
                  <label className="text-xs text-sigp-muted mb-1 block">Composante *</label>
                  <input required value={formData.composante} onChange={e => setFormData({ ...formData, composante: e.target.value })} className="sigp-input" placeholder="Composante 1" />
                </div>
              </div>
              <div>
                <label className="text-xs text-sigp-muted mb-1 block">Activité *</label>
                <textarea required rows={2} value={formData.activite} onChange={e => setFormData({ ...formData, activite: e.target.value })} className="sigp-input resize-none" placeholder="Description de l'activité..." />
              </div>
              
              <div className="grid grid-cols-4 gap-2">
                {[1, 2, 3, 4].map(q => (
                  <div key={q}>
                    <label className="text-xs text-sigp-muted mb-1 block">Q{q}</label>
                    <input type="number" min={0} value={(formData as any)[`q${q}`]} onChange={e => setFormData({ ...formData, [`q${q}`]: parseFloat(e.target.value) || 0 })} className="sigp-input" />
                  </div>
                ))}
              </div>

              <div className="bg-navy-900 p-3 rounded-lg flex justify-between items-center">
                <span className="text-xs text-sigp-muted">Budget Annuel Total :</span>
                <span className="font-mono font-bold text-sigp-blue text-lg">
                  {new Intl.NumberFormat('fr-FR').format((Number(formData.q1)||0) + (Number(formData.q2)||0) + (Number(formData.q3)||0) + (Number(formData.q4)||0))}
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
