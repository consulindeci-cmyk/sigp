import { memo } from 'react';
import type { PPMLigne, CategorieAchat, MethodePassation } from '@/types/ppm';
import { formatCurrency } from '@/lib/utils';
import { Badge } from '@/components/ui/data-display/Badge';
import { Button } from '@/components/ui/forms/Button';
import { Pencil, Eye, Trash2 } from 'lucide-react';

interface PPMMatrixRowProps {
  ligne:        PPMLigne;
  /** Libellé WBS résolu (code + titre) — undefined si non rattaché/introuvable. */
  wbsLabel?:    { code: string; titre: string };
  /** Devise du projet — le PPM n'a plus de devise propre à la ligne. */
  devise:       string;
  canManage:    boolean;
  canDelete:    boolean;
  onEdit:       (id: string) => void;
  onViewDetails:(id: string) => void;
  onDelete:     (id: string) => void;
}

const CATEGORIE_LABELS: Record<CategorieAchat, string> = {
  TRAVAUX:                  'Travaux',
  BIENS:                    'Fournitures',
  SERVICES_CONSULTANTS:     'Services de consultants',
  SERVICES_NON_CONSULTANTS: 'Services autres',
};

const CATEGORIE_BADGE_VARIANT: Record<CategorieAchat, 'default' | 'success' | 'warning' | 'info'> = {
  TRAVAUX:                  'default',
  BIENS:                    'success',
  SERVICES_CONSULTANTS:     'warning',
  SERVICES_NON_CONSULTANTS: 'info',
};

const METHODE_LABELS: Record<MethodePassation, string> = {
  AOI:  'AOI',
  AON:  'AON',
  CF:   'Demande de prix',
  ED:   'Entente directe',
  QCBS: 'QCBS',
  LCS:  'LCS',
};

function formatDateFR(dateStr?: string): string {
  if (!dateStr) return '—';
  const dt = new Date(dateStr);
  if (isNaN(dt.getTime())) return '—';
  return dt.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

const CELL = 'px-4 py-2.5 border-r border-b border-border text-sm';
const CELL_LAST = 'px-3 py-2.5 border-b border-border text-sm whitespace-nowrap';

function PPMMatrixRowComponent({ ligne, wbsLabel, devise, canManage, canDelete, onEdit, onViewDetails, onDelete }: PPMMatrixRowProps) {
  return (
    <tr className="hover:bg-muted/30 transition-colors group">

      {/* Référence du marché */}
      <td className={CELL}>
        <span className="font-mono font-semibold text-foreground whitespace-nowrap">{ligne.reference_marche}</span>
      </td>

      {/* Description du Marché + Badge WBS */}
      <td className={CELL}>
        <div className="font-semibold text-foreground whitespace-normal min-w-[220px]">{ligne.description}</div>
        {wbsLabel && (
          <div className="mt-1">
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-mono">
              {wbsLabel.code} — {wbsLabel.titre}
            </Badge>
          </div>
        )}
      </td>

      {/* Type */}
      <td className={CELL}>
        <Badge variant={CATEGORIE_BADGE_VARIANT[ligne.categorie]} className="text-[11px] whitespace-nowrap">
          {CATEGORIE_LABELS[ligne.categorie]}
        </Badge>
      </td>

      {/* Méthode d'acquisition */}
      <td className={CELL}>
        <span className="text-foreground font-medium whitespace-nowrap">{METHODE_LABELS[ligne.methode]}</span>
      </td>

      {/* Revue bailleur */}
      <td className={CELL}>
        <Badge variant={ligne.type_revue === 'PRIOR' ? 'info' : 'secondary'} className="text-[11px] whitespace-nowrap">
          {ligne.type_revue === 'PRIOR' ? 'A priori' : 'A posteriori'}
        </Badge>
      </td>

      {/* Date Avis / Publication */}
      <td className={`${CELL} text-center text-xs text-muted-foreground whitespace-nowrap`}>
        {formatDateFR(ligne.dates_cles.lancement_dao_prevue)}
      </td>

      {/* Date Signature Contrat */}
      <td className={`${CELL} text-center text-xs text-muted-foreground whitespace-nowrap`}>
        {formatDateFR(ligne.dates_cles.signature_contrat_prevue)}
      </td>

      {/* Montant Estimé */}
      <td className={`${CELL} text-right`}>
        <div className="font-mono font-semibold text-foreground whitespace-nowrap">
          {formatCurrency(ligne.montant_estime_base, devise)}
        </div>
      </td>

      {/* Actions */}
      <td className={CELL_LAST}>
        <div className="flex items-center justify-end gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          {canManage && (
            <Button variant="ghost" size="sm" aria-label="Modifier" onClick={() => onEdit(ligne.id)}>
              <Pencil className="h-3.5 w-3.5" />
            </Button>
          )}
          <Button variant="ghost" size="sm" aria-label="Voir détails / Étapes" onClick={() => onViewDetails(ligne.id)}>
            <Eye className="h-3.5 w-3.5" />
          </Button>
          {canDelete && (
            <Button
              variant="ghost" size="sm" aria-label="Supprimer"
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
}

export const PPMMatrixRow = memo(PPMMatrixRowComponent, (prevProps, nextProps) => {
  return prevProps.ligne.version_hash === nextProps.ligne.version_hash
    && prevProps.wbsLabel?.code === nextProps.wbsLabel?.code
    && prevProps.devise === nextProps.devise
    && prevProps.canManage === nextProps.canManage
    && prevProps.canDelete === nextProps.canDelete;
});
