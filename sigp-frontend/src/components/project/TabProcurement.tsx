import { useState } from 'react'
import { Plus, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/forms/Button'
import { Badge } from '@/components/ui/data-display/Badge'

const VIEWS = [
  { key: 'plan', label: 'Plan de Passation' },
  { key: 'contracts', label: 'Suivi des Contrats' },
  { key: 'approval', label: "Circuit d'Approbation" },
  { key: 'calendar', label: 'Calendrier' },
] as const

type View = typeof VIEWS[number]['key']

export default function TabProcurement() {
  const [view, setView] = useState<View>('plan')

  return (
    <div className="flex flex-col gap-4 p-4 bg-background min-h-full">

      {/* ── HEADER ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-foreground">Plan de Passation des Marchés</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Suivi des contrats et procédures d'appel d'offres</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-md border border-border bg-muted/10 p-0.5 gap-0.5">
            {VIEWS.map(v => (
              <button
                key={v.key}
                onClick={() => setView(v.key)}
                className={`px-2.5 py-1 rounded text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                  view === v.key
                    ? 'bg-card text-foreground shadow-sm border border-border'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {v.label}
              </button>
            ))}
          </div>
          <Button variant="default" size="sm" leftIcon={<Plus className="h-3.5 w-3.5" />} className="h-8 text-xs">
            Nouveau Marché
          </Button>
        </div>
      </div>

      {/* ── GRAPHES ─────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="px-4 py-2.5 border-b border-border bg-muted/5">
            <h3 className="text-sm font-semibold text-foreground">Statut des Contrats</h3>
          </div>
          <div className="p-4 h-40 bg-muted/5 flex items-center justify-center text-muted-foreground text-sm">
            Graphe statuts
          </div>
        </div>
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="px-4 py-2.5 border-b border-border bg-muted/5">
            <h3 className="text-sm font-semibold text-foreground">Chronologie des Passations</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Prévu vs signé, 2026</p>
          </div>
          <div className="p-4 h-40 bg-muted/5 flex items-center justify-center text-muted-foreground text-sm">
            Graphe timeline
          </div>
        </div>
      </div>

      {/* ── VUE PLAN ────────────────────────────────────────────────────────── */}
      {view === 'plan' && (
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm border-collapse">
              <thead>
                <tr className="bg-muted/30 border-b border-border">
                  <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Réf Marché</th>
                  <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-muted-foreground min-w-[220px]">Description</th>
                  <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Méthode</th>
                  <th className="px-4 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Montant Estimé</th>
                  <th className="px-4 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Montant Contrat</th>
                  <th className="px-4 py-2.5 text-center text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Date Prévue</th>
                  <th className="px-4 py-2.5 text-center text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Date Signature</th>
                  <th className="px-4 py-2.5 text-center text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Statut</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-border hover:bg-muted/10 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">PROC-001</td>
                  <td className="px-4 py-3 font-semibold text-foreground">Acquisition de transformateurs</td>
                  <td className="px-4 py-3 text-muted-foreground">Appel d'Offres Ouvert</td>
                  <td className="px-4 py-3 text-right font-mono text-foreground">$2.5M</td>
                  <td className="px-4 py-3 text-right font-mono text-foreground">$2.4M</td>
                  <td className="px-4 py-3 text-center text-muted-foreground">15/02/2026</td>
                  <td className="px-4 py-3 text-center text-muted-foreground">10/03/2026</td>
                  <td className="px-4 py-3 text-center">
                    <Badge variant="success" className="text-[10px]">Signé</Badge>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── VUE AUTRE (PLACEHOLDER) ─────────────────────────────────────────── */}
      {view !== 'plan' && (
        <div className="bg-card border border-border rounded-lg p-10 flex flex-col items-center justify-center gap-3 text-center">
          <Calendar className="h-10 w-10 text-muted-foreground" aria-hidden="true" />
          <p className="font-semibold text-foreground">Vue {VIEWS.find(v => v.key === view)?.label}</p>
          <p className="text-sm text-muted-foreground">Contenu de la vue en cours de développement.</p>
        </div>
      )}

    </div>
  )
}
