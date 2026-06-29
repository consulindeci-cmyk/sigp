import { useState } from 'react'
import { Plus, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/forms/Button'
import { StatCard } from '@/components/ui/data-display/StatCard'
import { Badge } from '@/components/ui/data-display/Badge'

const VIEWS = [
  { key: 'table', label: 'Tableau' },
  { key: 'gantt', label: 'Diagramme de Gantt' },
  { key: 'calendar', label: 'Vue Calendrier' },
] as const

type View = typeof VIEWS[number]['key']

export default function TabPTBA() {
  const [view, setView] = useState<View>('table')

  return (
    <div className="flex flex-col gap-4 p-4 bg-background min-h-full">

      {/* ── HEADER ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-foreground">Plan de Travail et Budget Annuel — 2026</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Suivi des activités et de l'exécution budgétaire annuelle</p>
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
            Ajouter Activité
          </Button>
        </div>
      </div>

      {/* ── KPI STRIP ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <StatCard
          title="Activités Terminées"
          value="58 / 76"
          iconVariant="success"
          description="Taux d'achèvement PTBA"
        />
        <StatCard
          title="Budget Annuel Prévu"
          value="$8.9M"
          iconVariant="primary"
          description="Plan de travail 2026"
        />
        <StatCard
          title="Budget Annuel Exécuté"
          value="$5.7M"
          iconVariant="warning"
          description="64% du budget annuel"
        />
      </div>

      {/* ── VUE TABLEAU ─────────────────────────────────────────────────────── */}
      {view === 'table' && (
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm border-collapse">
              <thead>
                <tr className="bg-muted/30 border-b border-border">
                  <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Code Activité</th>
                  <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-muted-foreground min-w-[220px]">Activité</th>
                  <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Composante</th>
                  <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Responsable</th>
                  <th className="px-4 py-2.5 text-center text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">T1</th>
                  <th className="px-4 py-2.5 text-center text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">T2</th>
                  <th className="px-4 py-2.5 text-center text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">T3</th>
                  <th className="px-4 py-2.5 text-center text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">T4</th>
                  <th className="px-4 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Budget</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-border hover:bg-muted/10 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">ACT-1.1.1</td>
                  <td className="px-4 py-3 font-semibold text-foreground">Étude d'impact environnemental</td>
                  <td className="px-4 py-3 text-muted-foreground">1. Infrastructure</td>
                  <td className="px-4 py-3 text-muted-foreground">Dr. M. Sarr</td>
                  <td className="px-4 py-3 text-center">
                    <Badge variant="success" className="text-[10px] px-1.5">✔</Badge>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="inline-block w-4 h-4 rounded border border-border bg-muted/30" />
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="inline-block w-4 h-4 rounded border border-border bg-muted/30" />
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="inline-block w-4 h-4 rounded border border-border bg-muted/30" />
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-foreground">$150K</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── VUE GANTT ───────────────────────────────────────────────────────── */}
      {view === 'gantt' && (
        <div className="bg-card border border-border rounded-lg p-8 flex items-center justify-center text-muted-foreground text-sm min-h-[200px]">
          Diagramme de Gantt (Placeholder)
        </div>
      )}

      {/* ── VUE CALENDRIER ─────────────────────────────────────────────────── */}
      {view === 'calendar' && (
        <div className="bg-card border border-border rounded-lg p-10 flex flex-col items-center justify-center gap-3 text-center">
          <Calendar className="h-10 w-10 text-muted-foreground" aria-hidden="true" />
          <p className="font-semibold text-foreground">Vue calendrier</p>
          <p className="text-sm text-muted-foreground">
            Basculez vers Tableau ou Gantt pour voir les activités programmées.
          </p>
        </div>
      )}

    </div>
  )
}
