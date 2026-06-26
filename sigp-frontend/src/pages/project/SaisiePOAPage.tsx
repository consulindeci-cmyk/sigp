import { useState, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { Plus, Trash2, Loader2, Filter, Save } from 'lucide-react'
import { PageHeader } from '@/components/layout/AppShell'
import { StatusBadge } from '@/components/shared/Badges'
import { useTasks, useCreateTask, useUpdateTask, useDeleteTask } from '@/hooks/useTasks'
import { useProject } from '@/hooks/useProjects'
import type { Tache, StatutTache } from '@/types'
import { formatDate } from '@/lib/utils'
import { useWBS } from '@/hooks/useWBS'

type EditingCell = { rowId: string; field: string } | null

const STATUTS: StatutTache[] = ['A_FAIRE', 'EN_COURS', 'TERMINE', 'EN_ATTENTE', 'ANNULE']
const STATUT_LABELS: Record<StatutTache, string> = {
  A_FAIRE: 'À faire', EN_COURS: 'En cours', TERMINE: 'Terminé',
  EN_ATTENTE: 'En attente', ANNULE: 'Annulé',
}

export default function SaisiePOAPage() {
  const { id: projectId = '' } = useParams()
  const [statutFilter, setStatutFilter] = useState<StatutTache | ''>('')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [editingCell, setEditingCell] = useState<EditingCell>(null)
  const [editValue, setEditValue] = useState('')

  const { data: project } = useProject(projectId)
  const { data: wbsData } = useWBS(projectId)
  const { data, isLoading } = useTasks(projectId, { limit: 200, statut: statutFilter || undefined })
  const createMutation = useCreateTask(projectId)
  const updateMutation = useUpdateTask(projectId)
  const deleteMutation = useDeleteTask(projectId)

  const taches = data?.data ?? []

  const addRow = async () => {
    await createMutation.mutateAsync({
      code_tache: `T${String(taches.length + 1).padStart(3, '0')}`,
      description: 'Nouvelle tâche',
      avancement: 0,
      cout_prevu: '0',
      cout_reel: '0',
      statut: 'A_FAIRE',
    })
  }

  const startEdit = (rowId: string, field: string, value: string) => {
    setEditingCell({ rowId, field })
    setEditValue(value)
  }

  const commitEdit = async (tache: Tache) => {
    if (!editingCell || editingCell.rowId !== tache.id) return
    const field = editingCell.field
    let val: string | number = editValue
    if (['avancement'].includes(field)) val = Math.min(100, Math.max(0, Number(editValue)))
    if (['cout_prevu', 'cout_reel'].includes(field)) val = editValue

    await updateMutation.mutateAsync({ id: tache.id, [field]: val })
    setEditingCell(null)
  }

  const deleteSelected = async () => {
    for (const id of Array.from(selected)) {
      await deleteMutation.mutateAsync(id)
    }
    setSelected(new Set())
  }

  const isEditing = (id: string, field: string) =>
    editingCell?.rowId === id && editingCell?.field === field

  const EditableCell = ({ tache, field, value, type = 'text', className = '' }: {
    tache: Tache; field: string; value: string; type?: string; className?: string
  }) => {
    const inputRef = useRef<HTMLInputElement>(null)
    if (isEditing(tache.id, field)) {
      return (
        <td className="p-0 cell-editing">
          <input
            ref={inputRef}
            type={type}
            value={editValue}
            autoFocus
            onChange={e => setEditValue(e.target.value)}
            onBlur={() => commitEdit(tache)}
            onKeyDown={e => {
              if (e.key === 'Enter') commitEdit(tache)
              if (e.key === 'Escape') setEditingCell(null)
            }}
            className={`w-full h-8 px-2 bg-navy-600 border border-sigp-blue outline-none text-sigp-text text-xs font-mono ${className}`}
          />
        </td>
      )
    }
    return (
      <td
        className={`cursor-pointer hover:bg-sigp-blue/5 ${className}`}
        onDoubleClick={() => startEdit(tache.id, field, value)}
        title="Double-clic pour éditer"
      >
        {value || <span className="text-sigp-muted/40">—</span>}
      </td>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title={`Saisie POA — ${project?.code_projet ?? '...'}`}
        subtitle={`${taches.length} tâche(s) · Double-clic sur une cellule pour éditer`}
        actions={
          <div className="flex items-center gap-2">
            {selected.size > 0 && (
              <button
                onClick={deleteSelected}
                disabled={deleteMutation.isPending}
                className="btn-danger flex items-center gap-1.5 text-xs"
              >
                <Trash2 size={13} /> Supprimer ({selected.size})
              </button>
            )}
            <button
              onClick={addRow}
              disabled={createMutation.isPending}
              className="btn-primary flex items-center gap-1.5 text-xs"
            >
              {createMutation.isPending
                ? <Loader2 size={13} className="animate-spin" />
                : <Plus size={13} />
              }
              Ajouter ligne
            </button>
          </div>
        }
      />

      {/* Filtre statut */}
      <div className="flex items-center gap-3 px-6 py-2 border-b border-navy-500 bg-navy-800/20">
        <Filter size={13} className="text-sigp-muted" />
        <div className="flex gap-1.5">
          {['', ...STATUTS].map((s) => (
            <button
              key={s}
              onClick={() => setStatutFilter(s as StatutTache | '')}
              className={`px-2.5 py-0.5 rounded text-xs border transition-colors ${
                statutFilter === s
                  ? 'bg-sigp-blue border-sigp-blue text-white'
                  : 'border-navy-500 text-sigp-muted hover:border-sigp-blue/50'
              }`}
            >
              {s === '' ? 'Tous' : STATUT_LABELS[s as StatutTache]}
            </button>
          ))}
        </div>
        {updateMutation.isPending && (
          <span className="ml-auto flex items-center gap-1.5 text-xs text-sigp-muted">
            <Save size={12} className="animate-pulse" /> Sauvegarde...
          </span>
        )}
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        {isLoading ? (
          <div className="flex justify-center py-16"><Loader2 className="animate-spin text-sigp-muted" /></div>
        ) : (
          <table className="excel-table min-w-max">
            <thead>
              <tr>
                <th className="w-8">
                  <input
                    type="checkbox"
                    onChange={e => setSelected(e.target.checked ? new Set(taches.map(t => t.id)) : new Set())}
                    checked={selected.size === taches.length && taches.length > 0}
                    className="accent-sigp-blue"
                  />
                </th>
                <th className="w-28">Code WBS</th>
                <th className="min-w-[200px]">Description</th>
                <th className="w-32">Responsable</th>
                <th className="w-28">Début</th>
                <th className="w-28">Fin</th>
                <th className="w-32 text-right">BAC (Prévu)</th>
                <th className="w-20 text-center">% Avanc.</th>
                <th className="w-32 text-right">AC (Réel)</th>
                <th className="w-28">Statut</th>
              </tr>
            </thead>
            <tbody>
              {taches.length === 0 ? (
                <tr>
                  <td colSpan={10} className="text-center py-8 text-sigp-muted">
                    Aucune tâche. Cliquez sur "Ajouter ligne" pour commencer.
                  </td>
                </tr>
              ) : (
                taches.map((t) => (
                  <tr key={t.id} className={selected.has(t.id) ? 'selected' : ''}>
                    <td className="text-center">
                      <input
                        type="checkbox"
                        checked={selected.has(t.id)}
                        onChange={e => setSelected(prev => {
                          const next = new Set(prev)
                          e.target.checked ? next.add(t.id) : next.delete(t.id)
                          return next
                        })}
                        className="accent-sigp-blue"
                      />
                    </td>
                    <EditableCell tache={t} field="code_tache" value={t.code_tache} className="font-mono text-sigp-blue font-medium" />
                    <EditableCell tache={t} field="description" value={t.description} className="min-w-[200px]" />
                    <EditableCell tache={t} field="responsable" value={t.responsable ?? ''} />
                    <EditableCell tache={t} field="date_debut" value={t.date_debut ? t.date_debut.split('T')[0] : ''} type="date" />
                    <EditableCell tache={t} field="date_fin" value={t.date_fin ? t.date_fin.split('T')[0] : ''} type="date" />
                    <EditableCell tache={t} field="cout_prevu" value={t.cout_prevu} type="number" className="text-right font-mono" />

                    {/* Avancement avec barre */}
                    {isEditing(t.id, 'avancement') ? (
                      <td className="p-0 cell-editing">
                        <input
                          type="number" min={0} max={100}
                          value={editValue}
                          autoFocus
                          onChange={e => setEditValue(e.target.value)}
                          onBlur={() => commitEdit(t)}
                          onKeyDown={e => e.key === 'Enter' ? commitEdit(t) : e.key === 'Escape' && setEditingCell(null)}
                          className="w-full h-8 px-2 bg-navy-600 border border-sigp-blue outline-none text-sigp-text text-xs text-center font-mono"
                        />
                      </td>
                    ) : (
                      <td
                        className="text-center cursor-pointer hover:bg-sigp-blue/5"
                        onDoubleClick={() => startEdit(t.id, 'avancement', String(t.avancement))}
                        title="Double-clic pour éditer"
                      >
                        <div className="flex flex-col items-center gap-0.5">
                          <span className="font-mono text-xs">{t.avancement}%</span>
                          <div className="w-12 h-1 bg-navy-600 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full bg-sigp-blue"
                              style={{ width: `${t.avancement}%` }}
                            />
                          </div>
                        </div>
                      </td>
                    )}

                    <EditableCell tache={t} field="cout_reel" value={t.cout_reel} type="number" className="text-right font-mono" />

                    {/* Statut select */}
                    <td>
                      <select
                        value={t.statut}
                        onChange={e => updateMutation.mutate({ id: t.id, statut: e.target.value as StatutTache })}
                        className="bg-transparent text-xs border-none outline-none cursor-pointer w-full"
                      >
                        {STATUTS.map(s => <option key={s} value={s}>{STATUT_LABELS[s]}</option>)}
                      </select>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
