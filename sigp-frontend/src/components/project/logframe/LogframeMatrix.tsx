import React, { useMemo, useState } from 'react';
import { Edit2, Trash2, Plus, ChevronDown, ChevronRight, Link2 } from 'lucide-react';
import type { CadreLogique } from '@/types';
import { flattenLogframeHierarchy } from '@/utils/tree';

interface LogframeMatrixProps {
  data: CadreLogique[];
  onEdit: (item: CadreLogique) => void;
  onDelete: (id: string) => void;
  onAddChild: (parentId: string, parentLevel: string) => void;
}

const NIVEAUX_HIERARCHIE = ['IMPACT', 'OBJECTIF', 'RESULTAT', 'PRODUIT', 'ACTIVITE'];

const getNiveauClass = (niveau: string) => {
  switch(niveau) {
    case 'IMPACT': return 'impact';
    case 'OBJECTIF': return 'outcome';
    case 'RESULTAT': return 'outcome'; // On peut utiliser outcome pour les résultats
    case 'PRODUIT': return 'output';
    case 'ACTIVITE': return 'activity';
    default: return 'activity';
  }
};

export function LogframeMatrix({ data, onEdit, onDelete, onAddChild }: LogframeMatrixProps) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  React.useEffect(() => {
    const initialExp = data.reduce((acc, curr) => ({...acc, [curr.id]: true}), {});
    setExpanded(initialExp);
  }, [data]);

  const toggleExpand = (id: string) => {
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const rootNodes = useMemo(() => data.filter(n => !n.parent_id), [data]);
  const flatItems = useMemo(() => flattenLogframeHierarchy(rootNodes, data), [rootNodes, data]);

  const visibleItems = useMemo(() => {
    return flatItems.filter(item => {
      let current = item as CadreLogique;
      while (current.parent_id) {
        if (!expanded[current.parent_id]) return false;
        current = data.find(n => n.id === current.parent_id) || current;
        if (current.id === item.id) break;
      }
      return true;
    });
  }, [flatItems, expanded, data]);

  const lfStyle = `
    .lf-row:hover { background: #FAFBFC !important; }
    .lf-row:last-child { border-bottom: none !important; }
  `;

  return (
    <div style={{ width: '100%', overflowX: 'auto' }}>
      <style>{lfStyle}</style>
      <div style={{ minWidth: '1000px' }} role="table" aria-label="Cadre Logique Matrix">
        {/* Header imitant .data-table thead th */}
        <div role="row" style={{ 
          display: 'flex', 
          background: 'var(--canvas)', 
          borderBottom: '1px solid var(--line)', 
          padding: '10px 14px',
          fontSize: '11px',
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.3px',
          color: 'var(--slate)'
        }}>
          <div role="columnheader" style={{ width: '32px', flexShrink: 0 }} />
          <div role="columnheader" style={{ width: '120px' }}>Niveau</div>
          <div role="columnheader" style={{ flex: 1, minWidth: '220px' }}>Description / Indicateur (IOV)</div>
          <div role="columnheader" style={{ width: '130px' }}>Baseline</div>
          <div role="columnheader" style={{ width: '130px' }}>Cible</div>
          <div role="columnheader" style={{ width: '160px' }}>Source de vérification</div>
          <div role="columnheader" style={{ width: '160px' }}>Hypothèses</div>
          <div role="columnheader" style={{ width: '100px', textAlign: 'right' }}>Actions</div>
        </div>

        <div role="rowgroup">
          {visibleItems.length === 0 ? (
            <div className="empty-state" style={{ padding: '40px 0' }}>
              <div className="es-title">Matrice Vide</div>
              <div className="es-sub">Commencez par définir un Impact.</div>
            </div>
          ) : (
            visibleItems.map(item => {
              const hasChildren = data.some(n => n.parent_id === item.id);
              const isActivite = item.niveau_intervention === 'ACTIVITE';
              const niveauClass = getNiveauClass(item.niveau_intervention);
              
              return (
                <div role="row" key={item.id} className="lf-row" style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  padding: '11px 14px',
                  borderBottom: '1px solid var(--line-soft)',
                  background: 'var(--surface)'
                }}>
                  
                  {/* Indentation et Toggle */}
                  <div role="cell" style={{ paddingLeft: `${item.level * 20}px`, display: 'flex', alignItems: 'center', width: `${32 + (item.level * 20)}px`, flexShrink: 0, marginTop: '2px' }}>
                    {hasChildren ? (
                      <button 
                        onClick={() => toggleExpand(item.id)} 
                        aria-expanded={!!expanded[item.id]}
                        style={{ background: 'transparent', border: 'none', color: 'var(--slate)', cursor: 'pointer', display: 'flex' }}
                      >
                        {expanded[item.id] ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                      </button>
                    ) : (
                      <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--line)', margin: '0 auto' }} />
                    )}
                  </div>

                  <div role="cell" style={{ width: '120px', flexShrink: 0, marginTop: '1px' }}>
                     <span className={`level-tag ${niveauClass}`}>{item.niveau_intervention}</span>
                  </div>

                  <div role="cell" style={{ flex: 1, minWidth: '220px', paddingRight: '16px' }}>
                     <div className={isActivite ? '' : 'cell-strong'} style={{ fontSize: '13px', color: isActivite ? 'var(--slate)' : 'var(--ink)' }}>
                       {item.indicateur}
                     </div>
                  </div>

                  <div role="cell" style={{ width: '130px', fontSize: '13px', color: 'var(--slate)', paddingRight: '12px' }}>
                    {item.valeur_reference || '-'}
                  </div>

                  <div role="cell" style={{ width: '130px', fontSize: '13px', color: 'var(--slate)', paddingRight: '12px' }}>
                    {item.cible || '-'}
                  </div>

                  <div role="cell" style={{ width: '160px', fontSize: '12.5px', color: 'var(--slate)', paddingRight: '12px', lineHeight: 1.4 }}>
                    {item.source_verification || '-'}
                  </div>

                  <div role="cell" style={{ width: '160px', fontSize: '12.5px', color: 'var(--slate)', lineHeight: 1.4 }}>
                    {item.hypotheses || '-'}
                  </div>

                  <div role="cell" style={{ width: '100px', display: 'flex', gap: '6px', justifyContent: 'flex-end', flexShrink: 0, marginTop: '1px' }}>
                    {!isActivite && (
                      <button className="icon-btn" onClick={() => onAddChild(item.id, item.niveau_intervention)} title="Ajouter un élément subordonné">
                        <Plus size={14} />
                      </button>
                    )}
                    {isActivite && (
                      <button className="icon-btn" title="Lier à une composante du WBS">
                        <Link2 size={14} />
                      </button>
                    )}
                    <button className="icon-btn" onClick={() => onEdit(item)} title="Modifier">
                      <Edit2 size={14} />
                    </button>
                    <button className="icon-btn" onClick={() => onDelete(item.id)} style={{ color: 'var(--red)' }} title="Supprimer">
                      <Trash2 size={14} />
                    </button>
                  </div>

                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
