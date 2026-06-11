import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { Plus, Loader2, Trash2 } from 'lucide-react'
import { PageHeader } from '@/components/layout/AppShell'
import { StatusBadge } from '@/components/shared/Badges'
import { usePPM, useCreateMarche, useUpdateMarche, useDeleteMarche } from '@/hooks/usePPM'
import { useProject } from '@/hooks/useProjects'
import type { Marche } from '@/types'

const TYPES_MARCHE = ['TRAVAUX', 'FOURNITURES', 'SERVICES', 'CONSULTANTS']
const METHODES = ['AOI', 'AON', 'DEMANDE_COTATION', 'SFQC', 'SMC', 'GRE_A_GRE']
const STATUTS = ['PLANIFIE', 'EN_COURS', 'ADJUGE', 'SIGNE', 'RESILIE', 'ANNULE']

export default function PPMPage() {
  const { id: projectId = '' } = useParams()
  const { data: project } = useProject(projectId)
  const { data: ppmData, isLoading } = usePPM(projectId)
  const createMutation = useCreateMarche(projectId)
  const updateMutation = useUpdateMarche(projectId)
  const deleteMutation = useDeleteMarche(projectId)

  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState<Partial<Marche>>({
    description_marche: '',
    type_marche: 'TRAVAUX',
    methode: 'AON',
    montant_estime: '',
    statut: 'PLANIFIE',
    date_prevue: ''
  })

  const marches = ppmData?.data ?? []

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    await createMutation.mutateAsync(formData)
    setShowModal(false)
    setFormData({
      description_marche: '', type_marche: 'TRAVAUX', methode: 'AON',
      montant_estime: '', statut: 'PLANIFIE', date_prevue: ''
    })
  }

  const handleUpdate = (id: string, field: keyof Marche, value: any) => {
    updateMutation.mutate({ id, [field]: value })
  }

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title={`Plan de Passation des Marchés (PPM) — ${project?.code_projet ?? '...'}`}
        subtitle="Programmation et suivi des marchés publics"
        actions={
          <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-1.5 text-xs">
            <Plus size={13} /> Ajouter un Marché
          </button>
        }
      />

      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="animate-spin text-sigp-muted" /></div>
      ) : (
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="bg-navy-800 border border-navy-500 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="excel-table">
                <thead>
                  <tr>
                    <th className="w-1/3">Description du Marché</th>
                    <th>Type</th>
                    <th>Méthode</th>
                    <th className="text-right">Montant Estimé ({project?.devise || 'XOF'})</th>
                    <th className="text-center">Date Prévue</th>
                    <th>Statut</th>
                    <th className="w-12"></th>
                  </tr>
                </thead>
                <tbody>
                  {marches.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-8 text-sigp-muted">Aucun marché planifié.</td>
                    </tr>
                  ) : (
                    marches.map((m: any) => (
                      <tr key={m.id}>
                        <td className="whitespace-normal text-xs font-medium">{m.description_marche}</td>
                        <td>
                          <select
                            value={m.type_marche}
                            onChange={(e) => handleUpdate(m.id, 'type_marche', e.target.value)}
                            className="bg-transparent border-none outline-none text-xs w-full text-sigp-blue font-semibold"
                          >
                            {TYPES_MARCHE.map(t => <option key={t} value={t} className="bg-navy-800 text-white">{t}</option>)}
                          </select>
                        </td>
                        <td>
                          <select
                            value={m.methode}
                            onChange={(e) => handleUpdate(m.id, 'methode', e.target.value)}
                            className="bg-transparent border-none outline-none text-xs w-full"
                          >
                            {METHODES.map(t => <option key={t} value={t} className="bg-navy-800 text-white">{t}</option>)}
                          </select>
                        </td>
                        <td className="text-right font-mono">
                          <input
                            type="number"
                            value={m.montant_estime}
                            onChange={(e) => handleUpdate(m.id, 'montant_estime', parseFloat(e.target.value) || 0)}
                            className="bg-transparent border-none outline-none text-right w-full font-mono"
                          />
                        </td>
                        <td className="text-center font-mono">
                          <input
                            type="date"
                            value={m.date_prevue ? new Date(m.date_prevue).toISOString().split('T')[0] : ''}
                            onChange={(e) => handleUpdate(m.id, 'date_prevue', new Date(e.target.value).toISOString())}
                            className="bg-transparent border-none outline-none text-center w-full text-xs"
                          />
                        </td>
                        <td>
                          <select
                            value={m.statut}
                            onChange={(e) => handleUpdate(m.id, 'statut', e.target.value)}
                            className="bg-transparent border-none outline-none text-xs w-full font-bold"
                          >
                            {STATUTS.map(t => <option key={t} value={t} className="bg-navy-800 text-white">{t}</option>)}
                          </select>
                        </td>
                        <td className="text-center">
                          <button onClick={() => deleteMutation.mutate(m.id)} className="text-sigp-muted hover:text-sigp-red transition-colors">
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
              <h3 className="text-sm font-semibold text-sigp-text">Planifier un nouveau Marché</h3>
              <button onClick={() => setShowModal(false)} className="text-sigp-muted hover:text-sigp-text"><Plus className="rotate-45" size={16} /></button>
            </div>
            <form onSubmit={handleCreate} className="p-5 space-y-4">
              <div>
                <label className="text-xs text-sigp-muted mb-1 block">Description du marché *</label>
                <textarea required rows={2} value={formData.description_marche} onChange={e => setFormData({ ...formData, description_marche: e.target.value })} className="sigp-input resize-none" placeholder="Ex: Acquisition de matériel informatique..." />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-sigp-muted mb-1 block">Type</label>
                  <select value={formData.type_marche} onChange={e => setFormData({ ...formData, type_marche: e.target.value as any })} className="sigp-input">
                    {TYPES_MARCHE.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-sigp-muted mb-1 block">Méthode</label>
                  <select value={formData.methode} onChange={e => setFormData({ ...formData, methode: e.target.value as any })} className="sigp-input">
                    {METHODES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-sigp-muted mb-1 block">Montant Estimé ({project?.devise})</label>
                  <input type="number" required min={0} value={formData.montant_estime} onChange={e => setFormData({ ...formData, montant_estime: parseFloat(e.target.value) })} className="sigp-input" />
                </div>
                <div>
                  <label className="text-xs text-sigp-muted mb-1 block">Date prévue</label>
                  <input type="date" value={formData.date_prevue} onChange={e => setFormData({ ...formData, date_prevue: new Date(e.target.value).toISOString() })} className="sigp-input" />
                </div>
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
