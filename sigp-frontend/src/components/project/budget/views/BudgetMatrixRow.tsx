import { memo } from 'react';
import type { BudgetLigne } from '@/types/budget';
import { formatMoney } from '@/utils/format';
import { Badge } from '@/components/ui/data-display/Badge';

interface BudgetMatrixRowProps {
  ligne: BudgetLigne;
}

export const BudgetMatrixRow = memo(({ ligne }: BudgetMatrixRowProps) => {
  return (
    <tr className="hover:bg-muted/30 transition-colors">

      {/* Sticky first column — WBS */}
      <td className="px-4 py-2.5 sticky left-0 z-[1] bg-card border-r border-border font-semibold text-foreground whitespace-nowrap">
        <div className="flex flex-col gap-0.5">
          <span>{ligne.wbs_nom || ligne.wbs_id}</span>
          <span className="text-[10px] text-muted-foreground/80">Réf: {ligne.wbs_id}</span>
        </div>
      </td>

      <td className="px-4 py-2.5">
        <Badge variant="outline" className="text-[11px]">
          {ligne.bailleur_nom || ligne.bailleur_id}
        </Badge>
      </td>

      <td className="px-4 py-2.5 text-xs text-muted-foreground">
        {ligne.categorie_id}
      </td>

      <td className="px-4 py-2.5 text-xs font-mono text-muted-foreground border-r-2 border-border">
        {ligne.compte_comptable_id || '-'}
      </td>

      {/* Budget */}
      <td className="px-4 py-2.5 text-right font-mono text-sm text-muted-foreground">
        {formatMoney(ligne.montant_initial)}
      </td>
      <td className="px-4 py-2.5 text-right font-mono text-sm font-semibold text-foreground border-r-2 border-border">
        {formatMoney(ligne.montant_revise)}
      </td>

      {/* Engagements */}
      <td className="px-4 py-2.5 text-right font-mono text-sm text-warning">
        {formatMoney(ligne.montant_pre_engage)}
      </td>
      <td className="px-4 py-2.5 text-right font-mono text-sm text-warning font-semibold border-r-2 border-border">
        {formatMoney(ligne.montant_engage)}
      </td>

      {/* Décaissements */}
      <td className="px-4 py-2.5 text-right font-mono text-sm text-muted-foreground">
        {formatMoney(ligne.montant_liquide)}
      </td>
      <td className="px-4 py-2.5 text-right font-mono text-sm font-semibold text-success border-r-2 border-border">
        {formatMoney(ligne.montant_decaisse)}
      </td>

      {/* Soldes */}
      <td className="px-4 py-2.5 text-right font-mono text-sm font-bold text-primary">
        {formatMoney(ligne.solde_disponible)}
      </td>
      <td className="px-4 py-2.5 text-right font-mono text-sm text-muted-foreground">
        {formatMoney(ligne.reste_a_payer)}
      </td>

    </tr>
  );
});

BudgetMatrixRow.displayName = 'BudgetMatrixRow';
