import { memo } from 'react';
import type { BudgetLigne } from '@/types/budget';
import { formatMoney } from '@/utils/format';
import { Badge } from '@/components/ui/data-display/Badge';
import { Button } from '@/components/ui/forms/Button';
import { Edit2, Copy, Trash2, Clock } from 'lucide-react';

interface BudgetMatrixRowProps {
  ligne:          BudgetLigne;
  hasHistory:     boolean;
  onEdit:         (ligne: BudgetLigne) => void;
  onDelete:       (id: string) => void;
  onDuplicate:    (id: string) => void;
  onViewHistory:  (id: string) => void;
}

export const BudgetMatrixRow = memo(({
  ligne, hasHistory, onEdit, onDelete, onDuplicate, onViewHistory,
}: BudgetMatrixRowProps) => {
  return (
    <tr className="hover:bg-muted/30 transition-colors group">

      {/* First column — WBS */}
      <td className="px-4 py-2.5 bg-card border-r border-border font-semibold text-foreground whitespace-nowrap">
        <div className="flex flex-col gap-0.5">
          <span>{ligne.libelle || ligne.code_ligne}</span>
          <span className="text-[10px] text-muted-foreground/80">Réf: {ligne.code_ligne}</span>
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
        {ligne.compte_comptable_id || '—'}
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
      <td className="px-4 py-2.5 text-right font-mono text-sm text-muted-foreground border-r-2 border-border">
        {formatMoney(ligne.reste_a_payer)}
      </td>

      {/* Actions */}
      <td className="px-3 py-2.5 whitespace-nowrap">
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost" size="sm" aria-label="Modifier la ligne"
            onClick={() => onEdit(ligne)}
          >
            <Edit2 className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost" size="sm" aria-label="Dupliquer la ligne"
            onClick={() => onDuplicate(ligne.id)}
          >
            <Copy className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost" size="sm" aria-label="Historique de la ligne"
            className={hasHistory ? 'text-primary' : 'text-muted-foreground'}
            onClick={() => onViewHistory(ligne.id)}
          >
            <Clock className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost" size="sm" aria-label="Supprimer la ligne"
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={() => onDelete(ligne.id)}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </td>

    </tr>
  );
});

BudgetMatrixRow.displayName = 'BudgetMatrixRow';
