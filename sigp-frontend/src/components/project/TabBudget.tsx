import { Download, Plus } from 'lucide-react'
import { Button } from '@/components/ui/forms/Button'

export default function TabBudget() {
  return (
    <div className="flex flex-col gap-4 p-4 bg-background min-h-full">

      {/* ── HEADER ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-foreground">Budget &amp; Finance</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Suivi de l'exécution budgétaire</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" leftIcon={<Download className="h-3.5 w-3.5" />} className="h-8 text-xs">
            Exporter
          </Button>
          <Button variant="default" size="sm" leftIcon={<Plus className="h-3.5 w-3.5" />} className="h-8 text-xs">
            Ajouter Ligne Budgétaire
          </Button>
        </div>
      </div>

      {/* ── GRAPHES ─────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="px-4 py-2.5 border-b border-border bg-muted/5">
            <h3 className="text-sm font-semibold text-foreground">Budget vs Réel</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Par trimestre, en millions USD</p>
          </div>
          <div className="p-4 h-40 bg-muted/5 flex items-center justify-center text-muted-foreground text-sm rounded-b-lg">
            Graphe Budget vs Réel
          </div>
        </div>
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="px-4 py-2.5 border-b border-border bg-muted/5">
            <h3 className="text-sm font-semibold text-foreground">Taux de Consommation</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Décaissement mensuel</p>
          </div>
          <div className="p-4 h-40 bg-muted/5 flex items-center justify-center text-muted-foreground text-sm rounded-b-lg">
            Graphe Burn Rate
          </div>
        </div>
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="px-4 py-2.5 border-b border-border bg-muted/5">
            <h3 className="text-sm font-semibold text-foreground">Allocation Budgétaire</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Par composante</p>
          </div>
          <div className="p-4 h-40 bg-muted/5 flex items-center justify-center text-muted-foreground text-sm rounded-b-lg">
            Graphe d'allocation
          </div>
        </div>
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="px-4 py-2.5 border-b border-border bg-muted/5">
            <h3 className="text-sm font-semibold text-foreground">Contribution Bailleurs</h3>
          </div>
          <div className="p-4 h-40 bg-muted/5 flex items-center justify-center text-muted-foreground text-sm rounded-b-lg">
            Graphe bailleurs
          </div>
        </div>
      </div>

      {/* ── TABLEAU LIGNES BUDGÉTAIRES ───────────────────────────────────────── */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="px-4 py-2.5 border-b border-border bg-muted/5">
          <h3 className="text-sm font-semibold text-foreground">Lignes Budgétaires</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm border-collapse">
            <thead>
              <tr className="bg-muted/30 border-b border-border">
                <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-muted-foreground min-w-[200px]">Ligne Budgétaire</th>
                <th className="px-4 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Qté</th>
                <th className="px-4 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Coût Unitaire</th>
                <th className="px-4 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Budget Prévu</th>
                <th className="px-4 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Engagé</th>
                <th className="px-4 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Décaissé</th>
                <th className="px-4 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Solde</th>
                <th className="px-4 py-2.5 text-center text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Taux de Conso.</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-border hover:bg-muted/10 transition-colors">
                <td className="px-4 py-3 font-semibold text-foreground">1.1 Équipements de réseau</td>
                <td className="px-4 py-3 text-right font-mono text-muted-foreground">1</td>
                <td className="px-4 py-3 text-right font-mono text-muted-foreground">$5.2M</td>
                <td className="px-4 py-3 text-right font-mono text-foreground">$5.2M</td>
                <td className="px-4 py-3 text-right font-mono text-foreground">$4.8M</td>
                <td className="px-4 py-3 text-right font-mono text-foreground">$3.1M</td>
                <td className="px-4 py-3 text-right font-mono text-foreground">$2.1M</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2 justify-center">
                    <div className="flex-1 max-w-[80px] h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full" style={{ width: '59%' }} />
                    </div>
                    <span className="font-mono text-xs tabular-nums text-muted-foreground w-8">59%</span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

    </div>
  )
}
