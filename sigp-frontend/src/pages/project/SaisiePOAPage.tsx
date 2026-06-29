import { PageHeader } from '@/components/layout/PageHeader';
import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { Plus, Trash2, Loader2, Filter, Save } from 'lucide-react'
import { useTasks, useCreateTask, useUpdateTask, useDeleteTask } from '@/hooks/useTasks'
import { Button } from '@/components/ui/forms/Button'
import type { Tache, StatutTache } from '@/types'

type EditingCell = { rowId: string; field: string } | null

const STATUTS: StatutTache[] = ['A_FAIRE', 'EN_COURS', 'TERMINE', 'EN_ATTENTE', 'ANNULE']
const STATUT_LABELS: Record<StatutTache, string> = {
  A_FAIRE: 'À faire', EN_COURS: 'En cours', TERMINE: 'Terminé',
  EN_ATTENTE: 'En attente', ANNULE: 'Annulé',
}

export default function SaisiePOAPage() {
  const { id: projectId = '' } = useParams()
  const [statutFilter, setStatutFilter] = useState<StatutTache | ''>('')
  const [selected, setSelected]         = useState<Set<string>>(new Set())
  const [editingCell, setEditingCell]   = useState<EditingCell>(null)
  const [editValue, setEditValue]       = useState('')

  const { data, isLoading } = useTasks(projectId, { limit: 200, statut: statutFilter || undefined })
  const createMutation      = useCreateTask(projectId)
  const updateMutation      = useUpdateTask(projectId)
  const deleteMutation      = useDeleteTask(projectId)

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
    if (field === 'avancement') val = Math.min(100, Math.max(0, Number(editValue)))

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

  // Inline-editable cell — double-click to activate input
  const EditableCell = ({
    tache, field, value, type = 'text', className = '',
  }: {
    tache: Tache; field: string; value: string; type?: string; className?: string
  }) => {
    if (isEditing(tache.id, field)) {
      return (
        <td className="p-0">
          <input
            type={type}
            value={editValue}
            autoFocus
            onChange={e => setEditValue(e.target.value)}
            onBlur={() => commitEdit(tache)}
            onKeyDown={e => {
              if (e.key === 'Enter') commitEdit(tache)
              if (e.key === 'Escape') setEditingCell(null)
            }}
            className={`w-full h-8 px-2 bg-muted border-2 border-primary outline-none text-foreground text-xs font-mono rounded-none ${className}`}
          />
        </td>
      )
    }
    return (
      <td
        className={`px-3 py-2 cursor-pointer hover:bg-primary/5 transition-colors ${className}`}
        onDoubleClick={() => startEdit(tache.id, field, value)}
        title="Double-clic pour éditer"
      >
        {value || <span className="text-muted-foreground/40">—</span>}
      </td>
    )
  }

  return (
    <div className="flex flex-col h-full overflow-hidden bg-background">

      {/* ── HEADER ─────────────────────────────────────────────────────────── */}
      <div className="shrink-0 flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b border-border bg-card">
        <div>
          <PageHeader title={`
            Saisie POA — {project?.code_projet ?? '—'}
          `} description={`
            {taches.length} tâche(s) · Double-clic sur une cellule pour éditer
          `} />
        </div>
        <div className="flex items-center gap-2">
          {selected.size > 0 && (
            <Button
              variant="destructive"
              size="sm"
              leftIcon={<Trash2 className="h-3.5 w-3.5" />}
              onClick={deleteSelected}
              disabled={deleteMutation.isPending}
              className="h-8 text-xs"
            >
              Supprimer ({selected.size})
            </Button>
          )}
          <Button
            variant="default"
            size="sm"
            leftIcon={
              createMutation.isPending
                ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                : <Plus className="h-3.5 w-3.5" />
            }
            onClick={addRow}
            disabled={createMutation.isPending}
            className="h-8 text-xs"
          >
            Ajouter ligne
          </Button>
        </div>
      </div>

      {/* ── BARRE DE FILTRES ───────────────────────────────────────────────── */}
      <div className="shrink-0 flex flex-wrap items-center gap-2 px-4 py-2 border-b border-border bg-muted/10">
        <Filter size={13} className="text-muted-foreground shrink-0" />
        <div className="flex flex-wrap gap-1.5">
          {(['', ...STATUTS] as (StatutTache | '')[]).map((s) => (
            <button
              key={s}
              onClick={() => setStatutFilter(s)}
              className={`px-2.5 py-0.5 rounded text-xs border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                statutFilter === s
                  ? 'bg-primary border-primary text-primary-foreground'
                  : 'border-border text-muted-foreground hover:border-primary/50 hover:text-foreground'
              }`}
            >
              {s === '' ? 'Tous' : STATUT_LABELS[s as StatutTache]}
            </button>
          ))}
        </div>
        {updateMutation.isPending && (
          <span className="ml-auto flex items-center gap-1.5 text-xs text-muted-foreground">
            <Save size={12} className="animate-pulse" /> Sauvegarde...
          </span>
        )}
      </div>

      {/* ── TABLEAU ────────────────────────────────────────────────────────── */}
      <div className="flex-1 min-h-0 overflow-auto">
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <table className="min-w-max w-full text-sm border-collapse">
            <thead>
              <tr className="bg-muted/30 border-b border-border sticky top-0 z-10">
                <th className="px-3 py-2.5 w-8">
                  <input
                    type="checkbox"
                    onChange={e =>
                      setSelected(e.target.checked ? new Set(taches.map(t => t.id)) : new Set())
                    }
                    checked={selected.size === taches.length && taches.length > 0}
                    className="accent-primary"
                    aria-label="Sélectionner toutes les tâches"
                  />
                </th>
                <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-muted-foreground w-28">Code WBS</th>
                <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-muted-foreground min-w-[200px]">Description</th>
                <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-muted-foreground w-32">Responsable</th>
                <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-muted-foreground w-28">Début</th>
                <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-muted-foreground w-28">Fin</th>
                <th className="px-3 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wide text-muted-foreground w-32">BAC (Prévu)</th>
                <th className="px-3 py-2.5 text-center text-[11px] font-semibold uppercase tracking-wide text-muted-foreground w-24">% Avanc.</th>
                <th className="px-3 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wide text-muted-foreground w-32">AC (Réel)</th>
                <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-muted-foreground w-28">Statut</th>
              </tr>
            </thead>
            <tbody>
              {taches.length === 0 ? (
                <tr>
                  <td colSpan={10} className="text-center py-12 text-muted-foreground text-sm">
                    Aucune tâche. Cliquez sur « Ajouter ligne » pour commencer.
                  </td>
                </tr>
              ) : (
                taches.map((t) => (
                  <tr
                    key={t.id}
                    className={`border-b border-border transition-colors ${
                      selected.has(t.id) ? 'bg-primary/5' : 'hover:bg-muted/10'
                    }`}
                  >
                    {/* Checkbox sélection */}
                    <td className="px-3 py-2 text-center">
                      <input
                        type="checkbox"
                        checked={selected.has(t.id)}
                        onChange={e => setSelected(prev => {
                          const next = new Set(prev)
                          e.target.checked ? next.add(t.id) : next.delete(t.id)
                          return next
                        })}
                        className="accent-primary"
                        aria-label={`Sélectionner ${t.code_tache}`}
                      />
                    </td>

                    {/* Cellules éditables */}
                    <EditableCell tache={t} field="code_tache"   value={t.code_tache}     className="font-mono text-primary font-medium" />
                    <EditableCell tache={t} field="description"  value={t.description} />
                    <EditableCell tache={t} field="responsable"  value={t.responsable ?? ''} />
                    <EditableCell tache={t} field="date_debut"   value={t.date_debut ? t.date_debut.split('T')[0] : ''} type="date" />
                    <EditableCell tache={t} field="date_fin"     value={t.date_fin   ? t.date_fin.split('T')[0]   : ''} type="date" />
                    <EditableCell tache={t} field="cout_prevu"   value={t.cout_prevu} type="number" className="text-right font-mono" />

                    {/* Avancement — cellule spéciale avec barre de progression */}
                    {isEditing(t.id, 'avancement') ? (
                      <td className="p-0">
                        <input
                          type="number" min={0} max={100}
                          value={editValue}
                          autoFocus
                          onChange={e => setEditValue(e.target.value)}
                          onBlur={() => commitEdit(t)}
                          onKeyDown={e => {
                            if (e.key === 'Enter') commitEdit(t)
                            if (e.key === 'Escape') setEditingCell(null)
                          }}
                          className="w-full h-8 px-2 bg-muted border-2 border-primary outline-none text-foreground text-xs text-center font-mono rounded-none"
                        />
                      </td>
                    ) : (
                      <td
                        className="px-3 py-2 text-center cursor-pointer hover:bg-primary/5 transition-colors"
                        onDoubleClick={() => startEdit(t.id, 'avancement', String(t.avancement))}
                        title="Double-clic pour éditer"
                      >
                        <div className="flex flex-col items-center gap-0.5">
                          <span className="font-mono text-xs tabular-nums">{t.avancement}%</span>
                          <div className="w-12 h-1 bg-muted rounded-full overflow-hidden">
                            {/* Dynamic width requires inline style — color class is Tailwind */}
                            <div className="h-full rounded-full bg-primary" style={{ width: `${t.avancement}%` }} />
                          </div>
                        </div>
                      </td>
                    )}

                    <EditableCell tache={t} field="cout_reel" value={t.cout_reel} type="number" className="text-right font-mono" />

                    {/* Statut */}
                    <td className="px-3 py-2">
                      <select
                        value={t.statut}
                        onChange={e =>
                          updateMutation.mutate({ id: t.id, statut: e.target.value as StatutTache })
                        }
                        className="bg-transparent text-xs border-none outline-none cursor-pointer w-full text-foreground"
                      >
                        {STATUTS.map(s => (
                          <option key={s} value={s}>{STATUT_LABELS[s]}</option>
                        ))}
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
