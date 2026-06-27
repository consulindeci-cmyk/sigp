import React from 'react';
import type { BudgetVersion } from '@/types/budget';
import { BudgetMatrixRow } from './BudgetMatrixRow';
import { Filter } from 'lucide-react';

interface BudgetMatrixProps {
  budgetVersion: BudgetVersion;
}

export function BudgetMatrix({ budgetVersion }: BudgetMatrixProps) {
  const lignes = budgetVersion.lignes || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      
      {/* Barre d'outils / Filtres Visuels (Maquette UI) */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        padding: '10px 16px', 
        background: 'var(--surface)', 
        borderBottom: '1px solid var(--line)',
        gap: '16px'
      }}>
        <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--navy-600)', display: 'flex', alignItems: 'center', gap: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          <Filter size={14} /> Filtres :
        </div>
        <select className="input" style={{ padding: '6px 12px', fontSize: '12px', height: 'auto', width: 'auto', background: 'var(--canvas)', border: '1px solid var(--line-soft)' }}>
          <option value="">Tous les Bailleurs</option>
          <option value="BM">Banque Mondiale</option>
          <option value="AFD">AFD</option>
        </select>
        <select className="input" style={{ padding: '6px 12px', fontSize: '12px', height: 'auto', width: 'auto', background: 'var(--canvas)', border: '1px solid var(--line-soft)' }}>
          <option value="">Toutes les Catégories</option>
          <option value="TRAVAUX">Travaux</option>
          <option value="BIENS">Biens</option>
        </select>
        <div style={{ flex: 1 }} />
        <div style={{ fontSize: '12px', color: 'var(--slate)', fontWeight: 500 }}>
          {lignes.length} Ligne(s) budgétaire(s)
        </div>
      </div>

      {/* Conteneur Scrollable (Préparé pour la Virtualisation) */}
      <div style={{ flex: 1, overflow: 'auto', position: 'relative' }} className="custom-scrollbar">
        <table className="w-full text-left border-collapse" style={{ minWidth: '1200px' }}>
          <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
            
            {/* Header Groupes */}
            <tr style={{ background: 'var(--navy-900)', color: 'white' }}>
              <th colSpan={4} style={{ padding: '8px 16px', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', borderRight: '2px solid var(--navy-700)', position: 'sticky', left: 0, zIndex: 11, background: 'var(--navy-900)' }}>
                Dimensions Analytiques
              </th>
              <th colSpan={2} style={{ padding: '8px 16px', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', borderRight: '2px solid var(--navy-700)', textAlign: 'center' }}>
                Budget
              </th>
              <th colSpan={2} style={{ padding: '8px 16px', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', borderRight: '2px solid var(--navy-700)', textAlign: 'center' }}>
                Engagements
              </th>
              <th colSpan={2} style={{ padding: '8px 16px', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', borderRight: '2px solid var(--navy-700)', textAlign: 'center' }}>
                Décaissements
              </th>
              <th colSpan={2} style={{ padding: '8px 16px', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'center' }}>
                Soldes
              </th>
            </tr>
            
            {/* Header Colonnes */}
            <tr style={{ background: 'var(--navy-800)', color: 'var(--slate-300)' }}>
              {/* Analytique */}
              <th style={{ padding: '10px 16px', fontSize: '12px', fontWeight: 600, borderRight: '1px solid var(--navy-700)', borderBottom: '1px solid var(--navy-900)', position: 'sticky', left: 0, zIndex: 11, background: 'var(--navy-800)' }}>Composante (WBS)</th>
              <th style={{ padding: '10px 16px', fontSize: '12px', fontWeight: 600, borderRight: '1px solid var(--navy-700)', borderBottom: '1px solid var(--navy-900)' }}>Bailleur</th>
              <th style={{ padding: '10px 16px', fontSize: '12px', fontWeight: 600, borderRight: '1px solid var(--navy-700)', borderBottom: '1px solid var(--navy-900)' }}>Catégorie</th>
              <th style={{ padding: '10px 16px', fontSize: '12px', fontWeight: 600, borderRight: '2px solid var(--navy-700)', borderBottom: '1px solid var(--navy-900)' }}>Compte (PCG)</th>
              
              {/* Budget */}
              <th style={{ padding: '10px 16px', fontSize: '12px', fontWeight: 600, textAlign: 'right', borderBottom: '1px solid var(--navy-900)' }}>Initial</th>
              <th style={{ padding: '10px 16px', fontSize: '12px', fontWeight: 600, textAlign: 'right', borderRight: '2px solid var(--navy-700)', borderBottom: '1px solid var(--navy-900)', color: 'white' }}>Révisé</th>
              
              {/* Engagements */}
              <th style={{ padding: '10px 16px', fontSize: '12px', fontWeight: 600, textAlign: 'right', borderBottom: '1px solid var(--navy-900)' }}>Pré-engagé</th>
              <th style={{ padding: '10px 16px', fontSize: '12px', fontWeight: 600, textAlign: 'right', borderRight: '2px solid var(--navy-700)', borderBottom: '1px solid var(--navy-900)' }}>Engagé</th>
              
              {/* Décaissements */}
              <th style={{ padding: '10px 16px', fontSize: '12px', fontWeight: 600, textAlign: 'right', borderBottom: '1px solid var(--navy-900)' }}>Liquidé</th>
              <th style={{ padding: '10px 16px', fontSize: '12px', fontWeight: 600, textAlign: 'right', borderRight: '2px solid var(--navy-700)', borderBottom: '1px solid var(--navy-900)' }}>Décaissé</th>
              
              {/* Soldes */}
              <th style={{ padding: '10px 16px', fontSize: '12px', fontWeight: 600, textAlign: 'right', borderBottom: '1px solid var(--navy-900)', color: 'white' }}>Disponible</th>
              <th style={{ padding: '10px 16px', fontSize: '12px', fontWeight: 600, textAlign: 'right', borderBottom: '1px solid var(--navy-900)' }}>Reste à payer</th>
            </tr>
          </thead>
          
          <tbody className="divide-y divide-gray-100">
            {lignes.length === 0 ? (
              <tr>
                <td colSpan={12} style={{ padding: '40px', textAlign: 'center', color: 'var(--slate)' }}>
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
