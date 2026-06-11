import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { Plus, Loader2, AlertTriangle, Trash2 } from 'lucide-react'
import { PageHeader } from '@/components/layout/AppShell'
import { StatusBadge } from '@/components/shared/Badges'
import { useRisks, useCreateRisk, useUpdateRisk, useDeleteRisk, useRiskMatrix } from '@/hooks/useRisks'
import { useProject } from '@/hooks/useProjects'

export default function RisksPage() {
  const { id: projectId = '' } = useParams()
  const { data: project } = useProject(projectId)
  const { data: risksData, isLoading } = useRisks(projectId)
  const { data: matrixData } = useRiskMatrix(projectId)
  const createMutation = useCreateRisk(projectId)
  const updateMutation = useUpdateRisk(projectId)
  const deleteMutation = useDeleteRisk(projectId)

  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({
    code_risque: '', description: '', categorie: 'FINANCIER',
    probabilite: 3, impact: 3, statut: 'OUVERT', plan_mitigation: ''
  })

  const risks = risksData?.data ?? []

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    await createMutation.mutateAsync({ ...formData, criticite: formData.probabilite * formData.impact })
    setShowModal(false)
  }

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title={`Registre des Risques — ${project?.code_projet ?? '...'}`}
        subtitle="Identification, évaluation et mitigation"
        actions={
          <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-1.5 text-xs">
            <Plus size={13} /> Nouveau Risque
          </button>
        }
      />

      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="animate-spin text-sigp-muted" /></div>
      ) : (
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Risk Matrix Summary */}
          {matrixData && (
            <div className="grid grid-cols-4 gap-4 mb-6">
              <div className="bg-sigp-red/10 border border-sigp-red/30 rounded-lg p-4 flex items-center gap-3">
                <AlertTriangle className="text-sigp-red" size={24} />
                <div>
                  <p className="text-xs text-sigp-red uppercase tracking-wider font-semibold">Critiques</p>
                  <p className="text-2xl font-bold text-sigp-red">{matrixData.CRITIQUE || 0}</p>
                </div>
              </div>
              <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-4 flex items-center gap-3">
                <AlertTriangle className="text-orange-400" size={24} />
                <div>
                  <p className="text-xs text-orange-400 uppercase tracking-wider font-semibold">Élevés</p>
                  <p className="text-2xl font-bold text-orange-400">{matrixData.ELEVE || 0}</p>
                </div>
              </div>
              <div className="bg-sigp-yellow/10 border border-sigp-yellow/30 rounded-lg p-4 flex items-center gap-3">
                <AlertTriangle className="text-sigp-yellow" size={24} />
                <div>
                  <p className="text-xs text-sigp-yellow uppercase tracking-wider font-semibold">Modérés</p>
                  <p className="text-2xl font-bold text-sigp-yellow">{matrixData.MODERE || 0}</p>
                </div>
              </div>
              <div className="bg-sigp-green/10 border border-sigp-green/30 rounded-lg p-4 flex items-center gap-3">
                <AlertTriangle className="text-sigp-green" size={24} />
                <div>
                  <p className="text-xs text-sigp-green uppercase tracking-wider font-semibold">Faibles</p>
                  <p className="text-2xl font-bold text-sigp-green">{matrixData.FAIBLE || 0}</p>
                </div>
              </div>
            </div>
          )}

          {/* Table */}
          <div className="bg-navy-800 border border-navy-500 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="excel-table">
                <thead>
                  <tr>
                    <th>Code</th>
                    <th className="w-1/4">Description</th>
                    <th>Catégorie</th>
                    <th className="text-center">Prob.</th>
                    <th className="text-center">Impact</th>
                    <th className="text-center">Score</th>
                    <th>Niveau</th>
                    <th>Statut</th>
                    <th className="w-1/4">Plan d'action</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {risks.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="text-center py-8 text-sigp-muted">Aucun risque enregistré.</td>
                    </tr>
                  ) : (
                    risks.map((r: any) => (
                      <tr key={r.id}>
                        <td className="font-mono text-sigp-blue">{r.code_risque}</td>
                        <td className="whitespace-normal text-xs">{r.description}</td>
                        <td><span className="px-2 py-0.5 rounded bg-navy-600 text-xs">{r.categorie}</span></td>
                        <td className="text-center font-mono">{r.probabilite}/5</td>
                        <td className="text-center font-mono">{r.impact}/5</td>
                        <td className="text-center font-mono font-bold">{r.criticite}</td>
                        <td><StatusBadge statut={r.niveau_criticite} /></td>
                        <td>
                          <select
                            value={r.statut}
                            onChange={(e) => updateMutation.mutate({ id: r.id, statut: e.target.value })}
                            className="bg-transparent border-none outline-none text-xs w-full"
                          >
                            <option value="OUVERT">Ouvert</option>
                            <option value="MITIGE">Mitigé</option>
                            <option value="FERME">Fermé</option>
                          </select>
                        </td>
                        <td className="whitespace-normal text-xs text-sigp-muted">{r.plan_mitigation || '—'}</td>
                        <td className="text-center">
                          <button onClick={() => deleteMutation.mutate(r.id)} className="text-sigp-muted hover:text-sigp-red transition-colors">
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
              <h3 className="text-sm font-semibold text-sigp-text">Nouveau Risque</h3>
              <button onClick={() => setShowModal(false)} className="text-sigp-muted hover:text-sigp-text"><Plus className="rotate-45" size={16} /></button>
            </div>
            <form onSubmit={handleCreate} className="p-5 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-sigp-muted mb-1 block">Code *</label>
                  <input required value={formData.code_risque} onChange={e => setFormData({ ...formData, code_risque: e.target.value })} className="sigp-input" placeholder="RSQ-001" />
                </div>
                <div>
                  <label className="text-xs text-sigp-muted mb-1 block">Catégorie</label>
                  <select value={formData.categorie} onChange={e => setFormData({ ...formData, categorie: e.target.value })} className="sigp-input">
                    <option value="FINANCIER">Financier</option>
                    <option value="TECHNIQUE">Technique</option>
                    <option value="ENVIRONNEMENTAL">Environnemental</option>
                    <option value="SOCIAL">Social</option>
                    <option value="OPERATIONNEL">Opérationnel</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs text-sigp-muted mb-1 block">Description *</label>
                <textarea required rows={2} value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className="sigp-input resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-sigp-muted mb-1 block">Probabilité (1-5)</label>
                  <input type="number" min={1} max={5} value={formData.probabilite} onChange={e => setFormData({ ...formData, probabilite: parseInt(e.target.value) })} className="sigp-input" />
                </div>
                <div>
                  <label className="text-xs text-sigp-muted mb-1 block">Impact (1-5)</label>
                  <input type="number" min={1} max={5} value={formData.impact} onChange={e => setFormData({ ...formData, impact: parseInt(e.target.value) })} className="sigp-input" />
                </div>
              </div>
              <div>
                <label className="text-xs text-sigp-muted mb-1 block">Plan d'action / Mitigation</label>
                <textarea rows={2} value={formData.plan_mitigation} onChange={e => setFormData({ ...formData, plan_mitigation: e.target.value })} className="sigp-input resize-none" />
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
