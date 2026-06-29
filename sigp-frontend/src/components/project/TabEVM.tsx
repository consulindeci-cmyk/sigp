import { Download, TrendingUp, TrendingDown, BarChart3 } from 'lucide-react'
import { StatCard } from '@/components/ui/data-display/StatCard'
import { Badge } from '@/components/ui/data-display/Badge'
import { Button } from '@/components/ui/forms/Button'

// Static EVM overview tab — shown as a summary inside the ProjectDetail view.
// Values are demonstration constants; full analysis is in the MoteurEVM page.

const EVM_ROWS = [
  {
    label: 'Écart de Coût (CV)',
    definition: 'Valeur Acquise − Coût Réel',
    valeur: '−$1.2M',
    variant: 'warning' as const,
    statut: 'Défavorable',
  },
  {
    label: 'Écart de Délai (SV)',
    definition: 'Valeur Acquise − Valeur Planifiée',
    valeur: '−$2.8M',
    variant: 'destructive' as const,
    statut: 'Défavorable',
  },
]

export default function TabEVM() {
  return (
    <div className="flex flex-col gap-4 bg-background">

      {/* ── HEADER ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-border">
        <div>
          <h1 className="text-base font-bold text-foreground">Gestion de la Valeur Acquise (EVM)</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Vue synthétique — À date (Juin 2026)</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          leftIcon={<Download className="h-3.5 w-3.5" />}
          className="h-8 text-xs"
          onClick={() => {/* export */}}
        >
          Exporter Rapport EVM
        </Button>
      </div>

      {/* ── KPI STRIP ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard
          title="IPC Global"
          value="0.91"
          icon={<TrendingUp className="h-4 w-4" />}
          iconVariant="warning"
          description="Léger dépassement de coût"
        />
        <StatCard
          title="IPD Global"
          value="0.79"
          icon={<TrendingDown className="h-4 w-4" />}
          iconVariant="destructive"
          description="En retard sur le planning"
        />
        <StatCard
          title="EAC"
          value="$27.0M"
          icon={<BarChart3 className="h-4 w-4" />}
          iconVariant="destructive"
          description="vs $24.6M (Budget initial)"
        />
        <StatCard
          title="Score de performance"
          value="B−"
          icon={<TrendingUp className="h-4 w-4" />}
          iconVariant="warning"
          description="IPC/IPD combinés"
        />
      </div>

      {/* ── COURBE EN S ────────────────────────────────────────────────────── */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="px-4 py-2.5 border-b border-border bg-muted/5">
          <h3 className="text-sm font-semibold text-foreground">Courbe en S</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Valeur Planifiée (VP) · Valeur Acquise (VA) · Coût Réel (CR), cumul en millions USD
          </p>
        </div>
        <div className="h-48 flex items-center justify-center bg-muted/5 text-muted-foreground text-xs">
          Courbe en S — voir onglet Moteur EVM pour le graphique interactif
        </div>
      </div>

      {/* ── GRAPHES TENDANCE ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="px-4 py-2.5 border-b border-border bg-muted/5">
            <h3 className="text-sm font-semibold text-foreground">Tendance IPC</h3>
          </div>
          <div className="h-40 flex items-center justify-center bg-muted/5 text-muted-foreground text-xs">
            Graphe IPC
          </div>
        </div>
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="px-4 py-2.5 border-b border-border bg-muted/5">
            <h3 className="text-sm font-semibold text-foreground">Tendance IPD</h3>
          </div>
          <div className="h-40 flex items-center justify-center bg-muted/5 text-muted-foreground text-xs">
            Graphe IPD
          </div>
        </div>
      </div>

      {/* ── INDICATEURS EVM ─────────────────────────────────────────────────── */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="px-4 py-2.5 border-b border-border bg-muted/5">
          <h3 className="text-sm font-semibold text-foreground">Indicateurs EVM</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm border-collapse">
            <thead>
              <tr className="bg-muted/30 border-b border-border">
                <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Indicateur</th>
                <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Définition</th>
                <th className="px-4 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Valeur</th>
                <th className="px-4 py-2.5 text-center text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Statut</th>
              </tr>
            </thead>
            <tbody>
              {EVM_ROWS.map((row, i) => (
                <tr key={i} className="border-b border-border last:border-0 hover:bg-muted/10 transition-colors">
                  <td className="px-4 py-3 font-semibold text-foreground text-sm">{row.label}</td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{row.definition}</td>
                  <td className="px-4 py-3 text-right font-mono font-bold tabular-nums">
                    <span className={row.variant === 'destructive' ? 'text-destructive' : 'text-warning'}>
                      {row.valeur}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Badge variant={row.variant}>{row.statut}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  )
}
