import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Search, ArrowRight, Loader2, X } from 'lucide-react'
import { PageHeader } from '@/components/layout/AppShell'
import { StatusBadge } from '@/components/shared/Badges'
import { useProjects, useCreateProject } from '@/hooks/useProjects'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { StatutProjet } from '@/types'

const schema = z.object({
  code_projet: z.string().min(1, 'Requis'),
  nom_projet: z.string().min(1, 'Requis'),
  bailleur_principal: z.string().min(1, 'Requis'),
  date_debut: z.string().min(1, 'Requis'),
  date_fin: z.string().min(1, 'Requis'),
  budget_total: z.string().min(1, 'Requis'),
  devise: z.string().min(1, 'Requis'),
  description: z.string().optional(),
})
type FormData = z.infer<typeof schema>

export default function ProjectsPage() {
  const [search, setSearch] = useState('')
  const [statut, setStatut] = useState<StatutProjet | ''>('')
  const [page, setPage] = useState(1)
  const [showModal, setShowModal] = useState(false)

  const { data, isLoading } = useProjects({ search: search || undefined, statut: statut || undefined, page, limit: 20 })
  const createMutation = useCreateProject()

  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { devise: 'XOF' },
  })

  const projets = data?.data ?? []
  const meta = data?.meta

  const onSubmit = async (values: FormData) => {
    await createMutation.mutateAsync(values)
    reset()
    setShowModal(false)
  }

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Projets"
        subtitle={`${meta?.total ?? 0} projet(s) au total`}
        actions={
          <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-1.5">
            <Plus size={14} /> Nouveau Projet
          </button>
        }
      />

      {/* Filters */}
      <div className="flex items-center gap-3 px-6 py-3 border-b border-navy-500 bg-navy-800/30">
        <div className="relative flex-1 max-w-sm">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-sigp-muted" />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
            placeholder="Rechercher un projet..."
            className="sigp-input pl-8 py-1.5 text-xs"
          />
        </div>
        <select
          value={statut}
          onChange={e => { setStatut(e.target.value as StatutProjet | ''); setPage(1) }}
          className="sigp-input w-36 py-1.5 text-xs"
        >
          <option value="">Tous statuts</option>
          {['PREPARATION', 'ACTIF', 'SUSPENDU', 'CLOTURE', 'ANNULE'].map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex justify-center py-16"><Loader2 className="animate-spin text-sigp-muted" /></div>
        ) : projets.length === 0 ? (
          <div className="text-center py-16 text-sigp-muted">
            <p className="mb-2">Aucun projet trouvé</p>
            <button onClick={() => setShowModal(true)} className="text-sigp-blue hover:underline text-sm">
              Créer votre premier projet
            </button>
          </div>
        ) : (
          <table className="excel-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Nom du Projet</th>
                <th>Bailleur</th>
                <th>Début</th>
                <th>Fin</th>
                <th className="text-right">Budget</th>
                <th>Devise</th>
                <th>Statut</th>
                <th>Tâches</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {projets.map(p => (
                <tr key={p.id}>
                  <td className="font-mono text-sigp-blue font-medium">{p.code_projet}</td>
                  <td className="max-w-xs truncate font-medium">{p.nom_projet}</td>
                  <td className="text-sigp-muted">{p.bailleur_principal}</td>
                  <td className="font-mono text-sigp-muted text-xs">{formatDate(p.date_debut)}</td>
                  <td className="font-mono text-sigp-muted text-xs">{formatDate(p.date_fin)}</td>
                  <td className="text-right font-mono">{formatCurrency(p.budget_total, p.devise)}</td>
                  <td className="text-sigp-muted font-mono text-xs">{p.devise}</td>
                  <td><StatusBadge statut={p.statut} /></td>
                  <td className="text-center text-sigp-muted">{p._count?.taches ?? 0}</td>
                  <td>
                    <Link
                      to={`/projects/${p.id}/dashboard`}
                      className="flex items-center gap-1 text-xs text-sigp-blue hover:text-sigp-blue-light"
                    >
                      Ouvrir <ArrowRight size={11} />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-between px-6 py-3 border-t border-navy-500 text-xs text-sigp-muted">
          <span>{meta.total} projets · Page {meta.page}/{meta.totalPages}</span>
          <div className="flex gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn-ghost py-1 px-2 disabled:opacity-40">← Préc.</button>
            <button onClick={() => setPage(p => Math.min(meta.totalPages, p + 1))} disabled={page === meta.totalPages} className="btn-ghost py-1 px-2 disabled:opacity-40">Suiv. →</button>
          </div>
        </div>
      )}

      {/* Modal Création */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-navy-800 border border-navy-500 rounded-xl w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-navy-500">
              <h3 className="text-sm font-semibold text-sigp-text">Nouveau Projet</h3>
              <button onClick={() => setShowModal(false)} className="text-sigp-muted hover:text-sigp-text"><X size={16} /></button>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-sigp-muted mb-1 block">Code projet *</label>
                  <input {...register('code_projet')} placeholder="PAEP-CI-2025" className="sigp-input" />
                  {errors.code_projet && <p className="text-sigp-red text-xs mt-1">{errors.code_projet.message}</p>}
                </div>
                <div>
                  <label className="text-xs text-sigp-muted mb-1 block">Devise</label>
                  <select {...register('devise')} className="sigp-input">
                    <option value="XOF">XOF (FCFA)</option>
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs text-sigp-muted mb-1 block">Nom du projet *</label>
                <input {...register('nom_projet')} placeholder="Projet d'Accès à l'Eau Potable" className="sigp-input" />
                {errors.nom_projet && <p className="text-sigp-red text-xs mt-1">{errors.nom_projet.message}</p>}
              </div>
              <div>
                <label className="text-xs text-sigp-muted mb-1 block">Bailleur principal *</label>
                <input {...register('bailleur_principal')} placeholder="Banque Mondiale" className="sigp-input" />
                {errors.bailleur_principal && <p className="text-sigp-red text-xs mt-1">{errors.bailleur_principal.message}</p>}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-sigp-muted mb-1 block">Date début *</label>
                  <input {...register('date_debut')} type="date" className="sigp-input" />
                </div>
                <div>
                  <label className="text-xs text-sigp-muted mb-1 block">Date fin *</label>
                  <input {...register('date_fin')} type="date" className="sigp-input" />
                </div>
              </div>
              <div>
                <label className="text-xs text-sigp-muted mb-1 block">Budget total *</label>
                <input {...register('budget_total')} placeholder="2500000.00" className="sigp-input" />
                {errors.budget_total && <p className="text-sigp-red text-xs mt-1">{errors.budget_total.message}</p>}
              </div>
              <div>
                <label className="text-xs text-sigp-muted mb-1 block">Description</label>
                <textarea {...register('description')} rows={2} className="sigp-input resize-none" />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-ghost">Annuler</button>
                <button type="submit" disabled={isSubmitting} className="btn-primary flex items-center gap-2">
                  {isSubmitting && <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                  Créer le projet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
