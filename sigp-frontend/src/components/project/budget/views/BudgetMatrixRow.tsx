import { memo } from 'react';
import type { BudgetLigne } from '@/types/budget';
import { formatMoney } from '@/utils/format';
import { Button } from '@/components/ui/forms/Button';
import { Edit2, Copy, Trash2, Clock } from 'lucide-react';

interface BudgetMatrixRowProps {
  ligne:          BudgetLigne;
  hasHistory:     boolean;
  canManage:      boolean;
  canDelete:      boolean;
  onEdit:         (ligne: BudgetLigne) => void;
  onDelete:       (id: string) => void;
  onDuplicate:    (id: string) => void;
  onViewHistory:  (id: string) => void;
  /** Indente visuellement la ligne quand elle est regroupée sous une bande
   * de composante WBS racine (cf. BudgetComponentSubtotalRow au-dessus). */
  indented?: boolean;
}

export const BudgetMatrixRow = memo(({
  ligne, hasHistory, canManage, canDelete, onEdit, onDelete, onDuplicate, onViewHistory, indented = false,
}: BudgetMatrixRowProps) => {
  // Montant réellement financé par le bailleur sur cette ligne — replie sur
  // le Coût Total quand non renseigné (financement intégral par défaut, cf.
  // BudgetLigneSlideOver). Disponible = Financement Bailleur − Coût Total.
  const montantBailleur = ligne.montant_bailleur ?? ligne.montant_revise;
  const disponible = montantBailleur - ligne.montant_revise;

  return (
    <tr className="hover:bg-muted/30 transition-colors group">

      {/* ── VALORISATION WBS ─────────────────────────────────────────────── */}
      <td className="px-4 py-2.5 bg-card border-r border-border font-mono text-xs text-muted-foreground whitespace-nowrap">
        {ligne.code_wbs || ligne.code_ligne}
      </td>
      <td className={`px-4 py-2.5 font-semibold text-foreground border-r-2 border-border ${indented ? 'pl-8' : ''}`}>
        {ligne.libelle || ligne.code_ligne}
      </td>

      {/* ── BUDGET ───────────────────────────────────────────────────────── */}
      <td className="px-4 py-2.5 text-xs text-muted-foreground whitespace-nowrap">
        {ligne.unite || '—'}
      </td>
      <td className="px-4 py-2.5 text-right font-mono text-xs text-muted-foreground">
        {ligne.quantite ?? '—'}
      </td>
      <td className="px-4 py-2.5 text-right font-mono text-xs text-muted-foreground">
        {ligne.cout_unitaire != null ? formatMoney(ligne.cout_unitaire) : '—'}
      </td>
      <td className="px-4 py-2.5 text-right font-mono text-sm font-semibold text-foreground border-r-2 border-border">
        {formatMoney(ligne.montant_revise)}
      </td>

      {/* ── SOLDES ───────────────────────────────────────────────────────── */}
      <td className="px-4 py-2.5 text-right font-mono text-sm font-semibold text-foreground">
        {formatMoney(montantBailleur)}
      </td>
      <td className={`px-4 py-2.5 text-right font-mono text-sm font-bold border-r-2 border-border ${disponible < 0 ? 'text-destructive' : 'text-primary'}`}>
        {disponible < 0 ? `-${formatMoney(Math.abs(disponible))}` : formatMoney(disponible)}
      </td>

      {/* Actions */}
      <td className="px-3 py-2.5 whitespace-nowrap">
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          {canManage && (
            <Button
              variant="ghost" size="sm" aria-label="Modifier la ligne"
              onClick={() => onEdit(ligne)}
            >
              <Edit2 className="h-3.5 w-3.5" />
            </Button>
          )}
          {canManage && (
            <Button
              variant="ghost" size="sm" aria-label="Dupliquer la ligne"
              onClick={() => onDuplicate(ligne.id)}
            >
              <Copy className="h-3.5 w-3.5" />
            </Button>
          )}
          <Button
            variant="ghost" size="sm" aria-label="Historique de la ligne"
            className={hasHistory ? 'text-primary' : 'text-muted-foreground'}
            onClick={() => onViewHistory(ligne.id)}
          >
            <Clock className="h-3.5 w-3.5" />
          </Button>
          {canDelete && (
            <Button
              variant="ghost" size="sm" aria-label="Supprimer la ligne"
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={() => onDelete(ligne.id)}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </td>

    </tr>
  );
});

BudgetMatrixRow.displayName = 'BudgetMatrixRow';
