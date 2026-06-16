import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { Plus, Loader2, Trash2 } from 'lucide-react'
import { PageHeader } from '@/components/layout/AppShell'
import { useLogframe, useCreateLogframe, useUpdateLogframe, useDeleteLogframe } from '@/hooks/useLogframe'
import { useProject } from '@/hooks/useProjects'
import type { CadreLogique } from '@/types'

const NIVEAUX = ['IMPACT', 'EFFET', 'RESULTAT', 'ACTIVITE']

export default function LogframePage() {
  const { id: projectId = '' } = useParams()
  const { data: project } = useProject(projectId)
  const { data: logframeData, isLoading } = useLogframe(projectId)
  const createMutation = useCreateLogframe(projectId)
  const updateMutation = useUpdateLogframe(projectId)
  const deleteMutation = useDeleteLogframe(projectId)

  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState<Partial<CadreLogique>>({
    niveau_intervention: 'RESULTAT',
    indicateur: '',
    valeur_reference: '',
    cible: '',
    source_verification: ''
  })

  const elements = logframeData?.data ?? []

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    await createMutation.mutateAsync(formData)
    setShowModal(false)
    setFormData({
      niveau_intervention: 'RESULTAT', indicateur: '', valeur_reference: '', cible: '', source_verification: ''
    })
  }

  const handleUpdate = (id: string, field: keyof CadreLogique, value: any) => {
    updateMutation.mutate({ id, [field]: value })
  }

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title={`Cadre Logique — ${project?.code_projet ?? '...'}`}
        subtitle="Matrice des indicateurs et résultats"
        actions={
          <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-1.5 text-xs">
            <Plus size={13} /> Ajouter Indicateur
          </button>
        }
      />

      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="animate-spin text-sigp-muted" /></div>
      ) : (
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="bg-navy-800 border border-navy-500 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="excel-table min-w-[900px]">
                <thead>
                  <tr>
                    <th className="w-32">Niveau</th>
                    <th className="w-1/3">Indicateur (IOV)</th>
                    <th className="w-32 text-center">Baseline</th>
                    <th className="w-32 text-center">Cible</th>
                    <th className="w-1/4">Source de Vérification</th>
                    <th className="w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {elements.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-sigp-muted">Aucun indicateur défini.</td>
                    </tr>
                  ) : (
                    elements.map((el: any) => (
                      <tr key={el.id} className={el.niveau_intervention === 'IMPACT' ? 'bg-sigp-blue/5' : ''}>
                        <td>
                          <select
                            value={el.niveau_intervention}
                            onChange={(e) => handleUpdate(el.id, 'niveau_intervention', e.target.value)}
                            className="bg-transparent border-none outline-none text-xs w-full font-bold"
                          >
                            {NIVEAUX.map(n => <option key={n} value={n} className="bg-navy-800 text-white">{n}</option>)}
                          </select>
                        </td>
                        <td className="whitespace-normal">
                          <textarea
                            rows={2}
                            value={el.indicateur}
                            onChange={(e) => handleUpdate(el.id, 'indicateur', e.target.value)}
                            className="bg-transparent border-none outline-none w-full resize-none text-xs"
                          />
                        </td>
                        <td className="text-center font-mono">
                          <input
                            type="text"
                            value={el.valeur_reference || ''}
                            onChange={(e) => handleUpdate(el.id, 'valeur_reference', e.target.value)}
                            className="bg-transparent border-none outline-none text-center w-full"
                          />
                        </td>
                        <td className="text-center font-mono font-bold text-sigp-blue">
                          <input
                            type="text"
                            value={el.cible || ''}
                            onChange={(e) => handleUpdate(el.id, 'cible', e.target.value)}
                            className="bg-transparent border-none outline-none text-center w-full"
                          />
                        </td>
                        <td className="whitespace-normal">
                          <textarea
                            rows={2}
                            value={el.source_verification || ''}
                            onChange={(e) => handleUpdate(el.id, 'source_verification', e.target.value)}
                            className="bg-transparent border-none outline-none w-full resize-none text-xs text-sigp-muted"
                          />
                        </td>
                        <td className="text-center">
                          <button onClick={() => deleteMutation.mutate(el.id)} className="text-sigp-muted hover:text-sigp-red transition-colors">
                            <Trash2 size={13} />
                          </button>
                        </td>
                      </tr>
                    ))
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
              <h3 className="text-sm font-semibold text-sigp-text">Nouvel Indicateur</h3>
              <button onClick={() => setShowModal(false)} className="text-sigp-muted hover:text-sigp-text"><Plus className="rotate-45" size={16} /></button>
            </div>
            <form onSubmit={handleCreate} className="p-5 space-y-4">
              <div>
                <label className="text-xs text-sigp-muted mb-1 block">Niveau d'intervention</label>
                <select value={formData.niveau_intervention} onChange={e => setFormData({ ...formData, niveau_intervention: e.target.value as any })} className="sigp-input">
                  {NIVEAUX.map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-sigp-muted mb-1 block">Indicateur (IOV) *</label>
                <textarea required rows={2} value={formData.indicateur} onChange={e => setFormData({ ...formData, indicateur: e.target.value })} className="sigp-input resize-none" placeholder="Description de l'indicateur..." />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-sigp-muted mb-1 block">Baseline (Référence)</label>
                  <input type="text" value={formData.valeur_reference} onChange={e => setFormData({ ...formData, valeur_reference: e.target.value })} className="sigp-input" placeholder="0" />
                </div>
                <div>
                  <label className="text-xs text-sigp-muted mb-1 block">Cible</label>
                  <input type="text" value={formData.cible} onChange={e => setFormData({ ...formData, cible: e.target.value })} className="sigp-input" placeholder="100" />
                </div>
              </div>
              <div>
                <label className="text-xs text-sigp-muted mb-1 block">Source de Vérification</label>
                <input type="text" value={formData.source_verification} onChange={e => setFormData({ ...formData, source_verification: e.target.value })} className="sigp-input" placeholder="Rapports annuels, Enquêtes..." />
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
