import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { Plus, Loader2, Trash2 } from 'lucide-react'
import { PageHeader } from '@/components/layout/AppShell'
import { useBudget, useCreateBudgetLine, useUpdateBudgetLine, useDeleteBudgetLine } from '@/hooks/useBudget'
import { useProject } from '@/hooks/useProjects'
import type { LigneBudgetaireDetail } from '@/types'

export default function BudgetPage() {
  const { id: projectId = '' } = useParams()
  const { data: project } = useProject(projectId)
  const { data: budgetData, isLoading } = useBudget(projectId)
  const createMutation = useCreateBudgetLine(projectId)
  const updateMutation = useUpdateBudgetLine(projectId)
  const deleteMutation = useDeleteBudgetLine(projectId)

  const lignes = budgetData?.data ?? []

  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState<Partial<LigneBudgetaireDetail>>({
    code_budget: '', rubrique: '', unite: 'U', quantite: 1, cout_unitaire: 0
  })

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    const qt = formData.quantite || 1
    const cu = Number(formData.cout_unitaire) || 0
    await createMutation.mutateAsync({
      ...formData,
      cout_total: qt * cu
    })
    setShowModal(false)
    setFormData({ code_budget: '', rubrique: '', unite: 'U', quantite: 1, cout_unitaire: 0 })
  }

  const handleUpdate = (id: string, ligne: any, field: keyof LigneBudgetaireDetail, value: any) => {
    const updated = { ...ligne, [field]: value }
    const qt = Number(updated.quantite) || 0
    const cu = Number(updated.cout_unitaire) || 0
    updateMutation.mutate({ id, [field]: value, cout_total: qt * cu })
  }

  const totalBudget = lignes.reduce((acc: number, l: any) => acc + Number(l.cout_total || 0), 0)

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title={`Budget Détaillé — ${project?.code_projet ?? '...'}`}
        subtitle="Planification financière par rubrique"
        actions={
          <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-1.5 text-xs">
            <Plus size={13} /> Nouvelle Rubrique
          </button>
        }
      />

      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="animate-spin text-sigp-muted" /></div>
      ) : (
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="bg-navy-800 border border-navy-500 rounded-lg p-5 flex justify-between items-center">
            <div>
              <p className="text-xs text-sigp-muted uppercase tracking-wider font-semibold">Budget Total Planifié</p>
              <p className="text-3xl font-bold text-sigp-blue mt-1">
                {new Intl.NumberFormat('fr-FR').format(totalBudget)} <span className="text-sm font-normal text-sigp-muted">{project?.devise}</span>
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-sigp-muted uppercase tracking-wider font-semibold">Enveloppe Globale du Projet</p>
              <p className="text-xl font-semibold text-white mt-1">
                {new Intl.NumberFormat('fr-FR').format(Number(project?.budget_total || 0))} <span className="text-sm font-normal text-sigp-muted">{project?.devise}</span>
              </p>
            </div>
          </div>

          <div className="bg-navy-800 border border-navy-500 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="excel-table">
                <thead>
                  <tr>
                    <th className="w-24">Code</th>
                    <th className="w-1/3">Rubrique</th>
                    <th className="text-center w-20">Unité</th>
                    <th className="text-right w-24">Quantité</th>
                    <th className="text-right w-40">Coût Unitaire ({project?.devise})</th>
                    <th className="text-right w-40">Coût Total ({project?.devise})</th>
                    <th className="w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {lignes.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-8 text-sigp-muted">Aucune ligne budgétaire.</td>
                    </tr>
                  ) : (
                    lignes.map((l: any) => (
                      <tr key={l.id}>
                        <td className="font-mono text-sigp-blue">
                          <input
                            type="text"
                            value={l.code_budget}
                            onChange={(e) => handleUpdate(l.id, l, 'code_budget', e.target.value)}
                            className="bg-transparent border-none outline-none w-full font-mono text-sigp-blue font-medium"
                          />
                        </td>
                        <td className="font-medium">
                          <input
                            type="text"
                            value={l.rubrique}
                            onChange={(e) => handleUpdate(l.id, l, 'rubrique', e.target.value)}
                            className="bg-transparent border-none outline-none w-full"
                          />
                        </td>
                        <td className="text-center">
                          <input
                            type="text"
                            value={l.unite || ''}
                            onChange={(e) => handleUpdate(l.id, l, 'unite', e.target.value)}
                            className="bg-transparent border-none outline-none w-full text-center"
                          />
                        </td>
                        <td className="text-right font-mono">
                          <input
                            type="number"
                            min={0}
                            step="0.01"
                            value={l.quantite}
                            onChange={(e) => handleUpdate(l.id, l, 'quantite', parseFloat(e.target.value) || 0)}
                            className="bg-transparent border-none outline-none w-full text-right font-mono"
                          />
                        </td>
                        <td className="text-right font-mono">
                          <input
                            type="number"
                            min={0}
                            step="0.01"
                            value={l.cout_unitaire}
                            onChange={(e) => handleUpdate(l.id, l, 'cout_unitaire', parseFloat(e.target.value) || 0)}
                            className="bg-transparent border-none outline-none w-full text-right font-mono text-sigp-yellow"
                          />
                        </td>
                        <td className="text-right font-mono font-bold bg-navy-900/50">
                          {new Intl.NumberFormat('fr-FR').format(Number(l.cout_total))}
                        </td>
                        <td className="text-center">
                          <button onClick={() => deleteMutation.mutate(l.id)} className="text-sigp-muted hover:text-sigp-red transition-colors">
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
              <h3 className="text-sm font-semibold text-sigp-text">Nouvelle Rubrique Budgétaire</h3>
              <button onClick={() => setShowModal(false)} className="text-sigp-muted hover:text-sigp-text"><Plus className="rotate-45" size={16} /></button>
            </div>
            <form onSubmit={handleCreate} className="p-5 space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1">
                  <label className="text-xs text-sigp-muted mb-1 block">Code *</label>
                  <input required value={formData.code_budget} onChange={e => setFormData({ ...formData, code_budget: e.target.value })} className="sigp-input" placeholder="B.1.1" />
                </div>
                <div className="col-span-2">
                  <label className="text-xs text-sigp-muted mb-1 block">Rubrique *</label>
                  <input required value={formData.rubrique} onChange={e => setFormData({ ...formData, rubrique: e.target.value })} className="sigp-input" placeholder="Ex: Achat véhicules" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-sigp-muted mb-1 block">Unité</label>
                  <input value={formData.unite} onChange={e => setFormData({ ...formData, unite: e.target.value })} className="sigp-input" placeholder="U, FF, Mois..." />
                </div>
                <div>
                  <label className="text-xs text-sigp-muted mb-1 block">Quantité</label>
                  <input type="number" required min={0} step="0.01" value={formData.quantite} onChange={e => setFormData({ ...formData, quantite: parseFloat(e.target.value) })} className="sigp-input" />
                </div>
                <div>
                  <label className="text-xs text-sigp-muted mb-1 block">Coût Unitaire</label>
                  <input type="number" required min={0} step="0.01" value={formData.cout_unitaire} onChange={e => setFormData({ ...formData, cout_unitaire: parseFloat(e.target.value) })} className="sigp-input" />
                </div>
              </div>
              <div className="bg-navy-900 p-3 rounded-lg flex justify-between items-center">
                <span className="text-xs text-sigp-muted">Coût Total Calculé :</span>
                <span className="font-mono font-bold text-sigp-blue text-lg">
                  {new Intl.NumberFormat('fr-FR').format((formData.quantite || 0) * (Number(formData.cout_unitaire) || 0))}
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
