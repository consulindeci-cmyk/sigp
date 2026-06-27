import React from 'react';
import type { BudgetLigne } from '@/types/budget';
import { formatMoney } from '@/utils/format';

interface BudgetMatrixRowProps {
  ligne: BudgetLigne;
}

export const BudgetMatrixRow = React.memo(({ ligne }: BudgetMatrixRowProps) => {
  return (
    <tr>
      {/* Colonnes Analytiques (Sticky pour la première) */}
      <td 
        style={{ 
          padding: '10px 16px',
          position: 'sticky', 
          left: 0, 
          background: 'var(--surface)', 
          zIndex: 1,
          borderRight: '1px solid var(--line-strong)',
          fontWeight: 700,
          color: 'var(--navy-900)'
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <span>{ligne.wbs_nom || ligne.wbs_id}</span>
          <span style={{ fontSize: '10px', color: 'var(--slate)', opacity: 0.8 }}>Réf: {ligne.wbs_id}</span>
        </div>
      </td>
      <td style={{ padding: '10px 16px' }}>
        <span className="chip" style={{ fontSize: '11px', padding: '2px 6px' }}>{ligne.bailleur_nom || ligne.bailleur_id}</span>
      </td>
      <td style={{ padding: '10px 16px' }}>
        <span style={{ fontSize: '12px', color: 'var(--slate)' }}>{ligne.categorie_id}</span>
      </td>
      <td style={{ padding: '10px 16px', borderRight: '2px solid var(--line-soft)' }}>
        <span style={{ fontSize: '12px', fontFamily: 'monospace', color: 'var(--slate)' }}>{ligne.compte_comptable_id || '-'}</span>
      </td>

      {/* Colonnes Financières (Alignées à droite, monospace) */}
      <td style={{ padding: '10px 16px', textAlign: 'right', fontFamily: 'monospace', color: 'var(--slate)' }}>
        {formatMoney(ligne.montant_initial)}
      </td>
      <td style={{ padding: '10px 16px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 600, color: 'var(--navy-900)', borderRight: '2px solid var(--line-soft)' }}>
        {formatMoney(ligne.montant_revise)}
      </td>
      
      {/* Engagements */}
      <td style={{ padding: '10px 16px', textAlign: 'right', fontFamily: 'monospace', color: 'var(--amber-600)' }}>
        {formatMoney(ligne.montant_pre_engage)}
      </td>
      <td style={{ padding: '10px 16px', textAlign: 'right', fontFamily: 'monospace', color: 'var(--orange-600)', borderRight: '2px solid var(--line-soft)' }}>
        {formatMoney(ligne.montant_engage)}
      </td>
      
      {/* Décaissements */}
      <td style={{ padding: '10px 16px', textAlign: 'right', fontFamily: 'monospace', color: 'var(--slate)' }}>
        {formatMoney(ligne.montant_liquide)}
      </td>
      <td style={{ padding: '10px 16px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 600, color: 'var(--green-600)', borderRight: '2px solid var(--line-soft)' }}>
        {formatMoney(ligne.montant_decaisse)}
      </td>

      {/* Soldes */}
      <td style={{ padding: '10px 16px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 700, color: 'var(--blue-600)' }}>
        {formatMoney(ligne.solde_disponible)}
      </td>
      <td style={{ padding: '10px 16px', textAlign: 'right', fontFamily: 'monospace', color: 'var(--slate)' }}>
        {formatMoney(ligne.reste_a_payer)}
      </td>
    </tr>
  );
});

BudgetMatrixRow.displayName = 'BudgetMatrixRow';
