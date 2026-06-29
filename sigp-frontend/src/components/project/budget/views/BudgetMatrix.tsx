import type { BudgetVersion } from '@/types/budget';
import { BudgetMatrixRow } from './BudgetMatrixRow';
import { Filter } from 'lucide-react';
import { Select } from '@/components/ui/forms/Select';

interface BudgetMatrixProps {
  budgetVersion: BudgetVersion;
}

export function BudgetMatrix({ budgetVersion }: BudgetMatrixProps) {
  const lignes = budgetVersion.lignes || [];

  return (
    <div className="flex flex-col h-full overflow-hidden">

      {/* ── Filter toolbar ──────────────────────────────────────────────── */}
      <div className="shrink-0 flex items-center flex-wrap gap-3 px-4 py-2.5 border-b border-border bg-card">
        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
          <Filter className="h-3.5 w-3.5" />
          Filtres :
        </div>
        <Select wrapperClassName="w-auto" className="h-8 text-xs py-1">
          <option value="">Tous les Bailleurs</option>
          <option value="BM">Banque Mondiale</option>
          <option value="AFD">AFD</option>
        </Select>
        <Select wrapperClassName="w-auto" className="h-8 text-xs py-1">
          <option value="">Toutes les Catégories</option>
          <option value="TRAVAUX">Travaux</option>
          <option value="BIENS">Biens</option>
        </Select>
        <div className="flex-1" />
        <span className="text-xs text-muted-foreground font-medium">
          {lignes.length} Ligne(s) budgétaire(s)
        </span>
      </div>

      {/* ── Scrollable table ────────────────────────────────────────────── */}
      <div className="flex-1 overflow-x-auto scrollbar-thin relative">
        <table className="w-full text-sm text-left border-collapse min-w-[1200px]">

          <thead className="sticky top-0 z-10">

            {/* Group header row */}
            <tr className="bg-primary text-primary-foreground">
              <th
                colSpan={4}
                className="px-4 py-2 text-[11px] font-semibold uppercase tracking-wide border-r-2 border-primary-foreground/20 sticky left-0 z-[12] bg-primary"
              >
                Dimensions Analytiques
              </th>
              <th colSpan={2} className="px-4 py-2 text-[11px] font-semibold uppercase tracking-wide border-r-2 border-primary-foreground/20 text-center">
                Budget
              </th>
              <th colSpan={2} className="px-4 py-2 text-[11px] font-semibold uppercase tracking-wide border-r-2 border-primary-foreground/20 text-center">
                Engagements
              </th>
              <th colSpan={2} className="px-4 py-2 text-[11px] font-semibold uppercase tracking-wide border-r-2 border-primary-foreground/20 text-center">
                Décaissements
              </th>
              <th colSpan={2} className="px-4 py-2 text-[11px] font-semibold uppercase tracking-wide text-center">
                Soldes
              </th>
            </tr>

            {/* Column header row */}
            <tr className="bg-primary/80 text-primary-foreground">
              <th className="px-4 py-2.5 text-xs font-semibold whitespace-nowrap border-r border-primary-foreground/20 border-b border-primary sticky left-0 z-[12] bg-primary/80">
                Composante (WBS)
              </th>
              <th className="px-4 py-2.5 text-xs font-semibold whitespace-nowrap border-r border-primary-foreground/20 border-b border-primary">
                Bailleur
              </th>
              <th className="px-4 py-2.5 text-xs font-semibold whitespace-nowrap border-r border-primary-foreground/20 border-b border-primary">
                Catégorie
              </th>
              <th className="px-4 py-2.5 text-xs font-semibold whitespace-nowrap border-r-2 border-primary-foreground/20 border-b border-primary">
                Compte (PCG)
              </th>

              <th className="px-4 py-2.5 text-xs font-semibold text-right whitespace-nowrap border-b border-primary">Initial</th>
              <th className="px-4 py-2.5 text-xs font-semibold text-right whitespace-nowrap border-r-2 border-primary-foreground/20 border-b border-primary">
                Révisé
              </th>

              <th className="px-4 py-2.5 text-xs font-semibold text-right whitespace-nowrap border-b border-primary">Pré-engagé</th>
              <th className="px-4 py-2.5 text-xs font-semibold text-right whitespace-nowrap border-r-2 border-primary-foreground/20 border-b border-primary">
                Engagé
              </th>

              <th className="px-4 py-2.5 text-xs font-semibold text-right whitespace-nowrap border-b border-primary">Liquidé</th>
              <th className="px-4 py-2.5 text-xs font-semibold text-right whitespace-nowrap border-r-2 border-primary-foreground/20 border-b border-primary">
                Décaissé
              </th>

              <th className="px-4 py-2.5 text-xs font-semibold text-right whitespace-nowrap border-b border-primary">Disponible</th>
              <th className="px-4 py-2.5 text-xs font-semibold text-right whitespace-nowrap border-b border-primary">Reste à payer</th>
            </tr>

          </thead>

          <tbody className="divide-y divide-border">
            {lignes.length === 0 ? (
              <tr>
                <td colSpan={12} className="px-4 py-10 text-center text-sm text-muted-foreground">
                  Aucune ligne budgétaire pour cette version.
                </td>
              </tr>
            ) : (
              lignes.map(ligne => (
                <BudgetMatrixRow key={ligne.id} ligne={ligne} />
              ))
            )}
          </tbody>

        </table>
      </div>

    </div>
  );
}
