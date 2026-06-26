import React, { useState, useEffect, useRef } from 'react';
import { ChevronRight, ChevronDown, Activity, AlertCircle } from 'lucide-react';
import type { PTBA, PTBALigne } from '@/types';
import { formatMoney } from '@/utils/format';

// ============================================================================
// SOUS-COMPOSANT : Ligne de Matrice (Préparation Virtualisation)
// ============================================================================
interface PTBAMatrixRowProps {
  initialLigne: PTBALigne;
  expandedQuarters: Record<string, boolean>;
  onLigneChange: (updatedLigne: PTBALigne) => void;
  // TODO: Add virtualization style prop here in the future
}

const PTBAMatrixRow = React.memo(({ initialLigne, expandedQuarters, onLigneChange }: PTBAMatrixRowProps) => {
  const [ligne, setLigne] = useState<PTBALigne>(initialLigne);
  const [editingCell, setEditingCell] = useState<string | null>(null);
  const [tempValue, setTempValue] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  // Synchronisation si la ligne initiale change (via le parent)
  useEffect(() => {
    setLigne(initialLigne);
  }, [initialLigne]);

  const handleCellClick = (monthKey: keyof PTBALigne) => {
    setEditingCell(monthKey);
    setTempValue(String(ligne[monthKey] || 0));
    setError(null);
  };

  const handleBlur = (monthKey: keyof PTBALigne) => {
    commitChange(monthKey);
  };

  const handleKeyDown = (e: React.KeyboardEvent, monthKey: keyof PTBALigne) => {
    if (e.key === 'Enter') {
      commitChange(monthKey);
    }
    if (e.key === 'Escape') {
      setEditingCell(null);
      setError(null);
    }
  };

  const commitChange = (monthKey: keyof PTBALigne) => {
    const val = parseFloat(tempValue);
    if (isNaN(val) || val < 0) {
      setError('Montant invalide');
      return;
    }

    const updated = { ...ligne, [monthKey]: val };

    // Calculs temps réel (Mois -> Trimestre -> Total Annuel)
    updated.q1_montant = updated.m1_montant + updated.m2_montant + updated.m3_montant;
    updated.q2_montant = updated.m4_montant + updated.m5_montant + updated.m6_montant;
    updated.q3_montant = updated.m7_montant + updated.m8_montant + updated.m9_montant;
    updated.q4_montant = updated.m10_montant + updated.m11_montant + updated.m12_montant;
    updated.montant_total = updated.q1_montant + updated.q2_montant + updated.q3_montant + updated.q4_montant;

    setLigne(updated);
    setEditingCell(null);
    setError(null);
    
    // Remonter le changement pour impacter les KPI globaux
    onLigneChange(updated);
  };

  const renderEditableMonth = (mKey: keyof PTBALigne) => {
    const isEditing = editingCell === mKey;
    return (
      <td key={mKey} style={{ padding: '0', background: 'var(--canvas)', color: 'var(--slate)', textAlign: 'right', position: 'relative', fontFamily: 'monospace', fontSize: '12px' }} onClick={() => !isEditing && handleCellClick(mKey)}>
        {isEditing ? (
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 50, background: 'var(--surface)', display: 'flex', alignItems: 'center', padding: '0 8px', border: '2px solid var(--navy-500)', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>
            <input 
              autoFocus
              type="number" 
              value={tempValue} 
              onChange={e => setTempValue(e.target.value)}
              onBlur={() => handleBlur(mKey)}
              onKeyDown={(e) => handleKeyDown(e, mKey)}
              style={{ width: '100%', border: 'none', outline: 'none', textAlign: 'right', background: 'transparent', fontSize: '13px', fontWeight: 600, color: 'var(--ink)', fontFamily: 'monospace' }}
            />
            {error && <div style={{ position: 'absolute', top: '-22px', right: 0, background: 'var(--red)', color: 'white', fontSize: '10px', padding: '2px 4px', borderRadius: '2px', whiteSpace: 'nowrap' }}>{error}</div>}
          </div>
        ) : (
          <div style={{ cursor: 'text', padding: '6px 12px', minHeight: '100%', display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
             {formatMoney(ligne[mKey] as number)}
          </div>
        )}
      </td>
    );
  };

  const renderQuarterGroup = (q: string, qKey: keyof PTBALigne, mKeys: (keyof PTBALigne)[]) => {
    const isExpanded = expandedQuarters[q];
    return (
      <React.Fragment key={q}>
        <td style={{ padding: '6px 12px', fontWeight: 600, background: isExpanded ? 'var(--navy-50)' : 'inherit', borderLeft: '1px solid var(--line)', textAlign: 'right', color: 'var(--navy-800)', fontFamily: 'monospace', fontSize: '12px' }}>
          {formatMoney(ligne[qKey] as number)}
        </td>
        {isExpanded && mKeys.map(mKey => renderEditableMonth(mKey))}
      </React.Fragment>
    );
  };

  return (
    <tr role="row" style={{ borderBottom: '1px solid var(--line-soft)', transition: 'background 0.1s' }} onMouseEnter={e => e.currentTarget.style.background = 'var(--slate-50)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
      {/* Colonne fixe */}
      <td style={{ position: 'sticky', left: 0, background: 'inherit', zIndex: 1, borderRight: '1px solid var(--line-strong)', padding: '6px 12px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, color: 'var(--navy-900)' }}>
            <Activity size={14} color="var(--slate)" />
            {ligne.activite_nom}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--slate)', paddingLeft: '20px' }}>
            WBS: {ligne.wbs_id} | Ref: {ligne.logframe_ref_id || 'N/A'}
          </div>
          {ligne.is_procurement && (
            <div style={{ fontSize: '11px', paddingLeft: '20px' }}>
               <span className="chip chip-warning" style={{ fontSize: '10px', padding: '2px 4px' }}>Achat: {ligne.type_marche}</span>
            </div>
          )}
        </div>
      </td>
      
      {/* Infos Base */}
      <td style={{ padding: '6px 12px', fontSize: '12px', color: 'var(--slate)' }}>{ligne.responsable_id || 'Non assigné'}</td>
      <td style={{ padding: '6px 12px', fontSize: '12px', color: 'var(--slate)' }}>{ligne.bailleur_id || '-'}</td>
      <td style={{ padding: '6px 12px', textAlign: 'right', fontWeight: 700, color: 'var(--navy-900)', fontFamily: 'monospace', fontSize: '13px', background: 'var(--slate-50)' }} title="Calculé automatiquement">
        {formatMoney(ligne.montant_total)}
      </td>
      
      {/* Quarters & Months */}
      {renderQuarterGroup('Q1', 'q1_montant', ['m1_montant', 'm2_montant', 'm3_montant'])}
      {renderQuarterGroup('Q2', 'q2_montant', ['m4_montant', 'm5_montant', 'm6_montant'])}
      {renderQuarterGroup('Q3', 'q3_montant', ['m7_montant', 'm8_montant', 'm9_montant'])}
      {renderQuarterGroup('Q4', 'q4_montant', ['m10_montant', 'm11_montant', 'm12_montant'])}
    </tr>
  );
});

// ============================================================================
// COMPOSANT PRINCIPAL : Matrice PTBA
// ============================================================================
interface PTBAMatrixProps {
  ptba: PTBA;
  onUpdatePTBA?: (updatedPTBA: PTBA) => void;
}

export default function PTBAMatrix({ ptba, onUpdatePTBA }: PTBAMatrixProps) {
  const [expandedQuarters, setExpandedQuarters] = useState<Record<string, boolean>>({
    Q1: false, Q2: false, Q3: false, Q4: false,
  });

  const toggleQuarter = (q: string) => {
    setExpandedQuarters(prev => ({ ...prev, [q]: !prev[q] }));
  };

  const handleLigneChange = (updatedLigne: PTBALigne) => {
    // Dans une vraie application, on ferait une mutation API ici (ou debounce)
    // Pour l'interface, on remonte l'info pour mettre à jour les KPI globaux
    if (!ptba.lignes) return;
    
    const newLignes = ptba.lignes.map(l => l.id === updatedLigne.id ? updatedLigne : l);
    const newTotal = newLignes.reduce((acc, curr) => acc + curr.montant_total, 0);
    
    if (onUpdatePTBA) {
      onUpdatePTBA({ ...ptba, lignes: newLignes, budget_total: newTotal });
    }
  };

  const renderQuarterHeader = (q: string, months: string[]) => {
    const isExpanded = expandedQuarters[q];
    return (
      <React.Fragment key={q}>
        <th 
          style={{ minWidth: '100px', cursor: 'pointer', background: isExpanded ? 'var(--navy-50)' : 'var(--surface)', borderLeft: '1px solid var(--line)', textAlign: 'right', padding: '6px 12px', fontSize: '11px', textTransform: 'uppercase', color: 'var(--navy-800)', borderBottom: '2px solid var(--line-strong)' }}
          onClick={() => toggleQuarter(q)}
          title="Cliquez pour détailler par mois"
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px' }}>
            {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
            {q}
          </div>
        </th>
        {isExpanded && months.map(m => (
          <th key={m} style={{ minWidth: '80px', background: 'var(--canvas)', color: 'var(--slate)', fontWeight: 600, textAlign: 'right', padding: '6px 12px', fontSize: '11px', textTransform: 'uppercase', borderBottom: '2px solid var(--line-strong)' }}>
            {m}
          </th>
        ))}
      </React.Fragment>
    );
  };

  if (!ptba.lignes || ptba.lignes.length === 0) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: 'var(--slate)' }}>
        Aucune ligne PTBA n'est disponible.
      </div>
    );
  }

  return (
    <div style={{ overflowX: 'auto', overflowY: 'auto', height: '100%', background: 'var(--surface)' }}>
      <table className="wbs-table" role="table" style={{ borderCollapse: 'collapse', width: '100%', fontSize: '12px' }}>
        <thead style={{ position: 'sticky', top: 0, zIndex: 10, background: 'var(--surface)', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
          <tr>
            <th style={{ position: 'sticky', left: 0, zIndex: 11, background: 'var(--surface)', minWidth: '250px', borderRight: '1px solid var(--line-strong)', padding: '6px 12px', fontSize: '11px', textTransform: 'uppercase', color: 'var(--slate)', borderBottom: '2px solid var(--line-strong)', textAlign: 'left' }}>Activité & Description</th>
            <th style={{ minWidth: '100px', padding: '6px 12px', fontSize: '11px', textTransform: 'uppercase', color: 'var(--slate)', borderBottom: '2px solid var(--line-strong)', textAlign: 'left' }}>Responsable</th>
            <th style={{ minWidth: '100px', padding: '6px 12px', fontSize: '11px', textTransform: 'uppercase', color: 'var(--slate)', borderBottom: '2px solid var(--line-strong)', textAlign: 'left' }}>Bailleur</th>
            <th style={{ minWidth: '120px', textAlign: 'right', padding: '6px 12px', fontSize: '11px', textTransform: 'uppercase', color: 'var(--navy-800)', borderBottom: '2px solid var(--line-strong)', background: 'var(--slate-50)' }}>Budget Total (Calc)</th>
            
            {renderQuarterHeader('Q1', ['Jan', 'Fév', 'Mar'])}
            {renderQuarterHeader('Q2', ['Avr', 'Mai', 'Juin'])}
            {renderQuarterHeader('Q3', ['Juil', 'Août', 'Sept'])}
            {renderQuarterHeader('Q4', ['Oct', 'Nov', 'Déc'])}
          </tr>
        </thead>
        <tbody style={{ background: 'var(--surface)' }}>
          {ptba.lignes.map(ligne => (
            <PTBAMatrixRow 
              key={ligne.id} 
              initialLigne={ligne} 
              expandedQuarters={expandedQuarters} 
              onLigneChange={handleLigneChange} 
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
