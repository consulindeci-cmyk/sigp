import React, { useMemo } from 'react';
import { 
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Edit2, Trash2, Plus, GripVertical, ChevronDown, ChevronRight } from 'lucide-react';
import type { WBS } from '@/types';
import { flattenWBSTree } from '@/utils/tree';

interface WBSTreeProps {
  data: WBS[];
  onReorder: (items: WBS[]) => void;
  onEdit: (node: WBS) => void;
  onDelete: (id: string) => void;
  onAddChild: (parentId: string) => void;
}

const statusBadge = (statut: string) => {
  switch (statut) {
    case 'NON_COMMENCE': return <span className="chip planned">Non commencé</span>;
    case 'EN_COURS': return <span className="chip on-track">En cours</span>;
    case 'TERMINE': return <span className="chip closed">Terminé</span>;
    case 'EN_RETARD': return <span className="chip delayed">En retard</span>;
    case 'ANNULE': return <span className="chip closed">Annulé</span>;
    default: return <span className="chip planned">Non commencé</span>;
  }
};

function SortableNode({ 
  node, 
  childrenNodes,
  onEdit, 
  onDelete, 
  onAddChild,
  expanded,
  toggleExpand
}: { 
  node: WBS; 
  childrenNodes: WBS[];
  onEdit: (n: WBS) => void;
  onDelete: (id: string) => void;
  onAddChild: (id: string) => void;
  expanded: boolean;
  toggleExpand: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: node.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    position: 'relative' as const,
    zIndex: isDragging ? 10 : 1,
  };

  const hasChildren = childrenNodes.length > 0;
  
  const formatMoney = (amount: number = 0) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', maximumFractionDigits: 0 }).format(amount);
  };

  const indentLevel = node.niveau - 1;

  return (
    <div ref={setNodeRef} className="wbs-row" role="row" style={Object.assign({}, style, {
      display: 'flex',
      alignItems: 'center',
      padding: '11px 14px',
      borderBottom: '1px solid var(--line-soft)',
      background: 'var(--surface)',
      position: 'relative'
    })}>
      
      {/* Drag Handle */}
      <div {...attributes} {...listeners} role="button" tabIndex={0} style={{ padding: '0 4px', color: 'var(--slate-light)', cursor: 'grab', marginRight: '6px', flexShrink: 0 }}>
        <GripVertical size={15} />
      </div>

      {/* Indentation with connectors */}
      <div role="cell" style={{ display: 'flex', width: `${indentLevel * 24}px`, flexShrink: 0, position: 'relative', height: '100%' }}>
        {indentLevel > 0 && (
          <div style={{
            position: 'absolute',
            left: `${(indentLevel - 1) * 24 + 11}px`,
            top: '-23px', // remonte pour lier avec l'élément au-dessus
            height: '46px',
            borderLeft: '1px solid var(--line)',
            borderBottom: '1px solid var(--line)',
            width: '12px'
          }} />
        )}
      </div>
      
      {/* Expander */}
      <div role="cell" style={{ width: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginRight: '8px' }}>
        {hasChildren ? (
          <button 
            onClick={toggleExpand} 
            aria-expanded={expanded}
            style={{ background: 'transparent', border: 'none', color: 'var(--slate)', display: 'flex' }}
          >
            {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </button>
        ) : (
          <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--line)', marginLeft: '4px' }} />
        )}
      </div>

      {/* Code + Titre */}
      <div role="cell" style={{ flex: 1, minWidth: '200px', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span className="cell-mono">{node.code_wbs}</span>
        <span className={node.niveau === 1 ? 'cell-strong' : ''} style={{ color: 'var(--ink)' }}>{node.titre}</span>
      </div>

      {/* Columns */}
      <div role="cell" style={{ width: '140px', color: 'var(--slate)', fontSize: '13px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {node.responsable || '-'}
      </div>

      <div role="cell" style={{ width: '120px', textAlign: 'right', fontWeight: 600, color: 'var(--ink)', fontSize: '13px' }}>
        {formatMoney(node.budget_alloue)}
      </div>

      <div role="cell" style={{ width: '140px', padding: '0 16px' }}>
        <div className="progress-wrap">
          <div className="progress-track">
            <div className={`progress-fill ${node.progression_physique === 100 ? 'green' : ''}`} style={{ width: `${node.progression_physique || 0}%` }} />
          </div>
          <span className="pct">{Math.round(node.progression_physique || 0)}%</span>
        </div>
      </div>

      <div role="cell" style={{ width: '120px' }}>
        {statusBadge(node.statut || 'NON_COMMENCE')}
      </div>

      <div role="cell" style={{ width: '90px', display: 'flex', gap: '6px', justifyContent: 'flex-end', flexShrink: 0 }}>
        <button className="icon-btn" onClick={() => onAddChild(node.id)} title="Ajouter sous-élément">
          <Plus size={14} />
        </button>
        <button className="icon-btn" onClick={() => onEdit(node)} title="Modifier">
          <Edit2 size={14} />
        </button>
        <button className="icon-btn" onClick={() => onDelete(node.id)} style={{ color: 'var(--red)' }} title="Supprimer">
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}

export function WBSTree({ data, onReorder, onEdit, onDelete, onAddChild }: WBSTreeProps) {
  const rootNodes = useMemo(() => data.filter(n => !n.parent_id).sort((a, b) => a.ordre - b.ordre), [data]);
  const flatItems = useMemo(() => flattenWBSTree(rootNodes, data), [rootNodes, data]);
  
  const [expanded, setExpanded] = React.useState<Record<string, boolean>>({});
  
  React.useEffect(() => {
    const initialExp = data.reduce((acc, curr) => ({...acc, [curr.id]: true}), {});
    setExpanded(initialExp);
  }, [data]);

  const toggleExpand = (id: string) => {
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = flatItems.findIndex(i => i.id === active.id);
      const newIndex = flatItems.findIndex(i => i.id === over.id);
      onReorder(arrayMove(flatItems, oldIndex, newIndex));
    }
  };

  const visibleItems = useMemo(() => {
    return flatItems.filter(item => {
      let current = item;
      while (current.parent_id) {
        if (!expanded[current.parent_id]) return false;
        current = data.find(n => n.id === current.parent_id) || current;
        if (current.id === item.id) break; 
      }
      return true;
    });
  }, [flatItems, expanded, data]);

  // CSS global pour le hover state
  const wbsStyle = `
    .wbs-row:hover { background: #FAFBFC !important; }
    .wbs-row:last-child { border-bottom: none !important; }
  `;

  return (
    <div style={{ width: '100%', overflowX: 'auto' }}>
      <style>{wbsStyle}</style>
      <div style={{ minWidth: '900px' }} role="table" aria-label="WBS Tree">
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
          <div role="columnheader" style={{ width: '28px', flexShrink: 0 }} /> {/* drag handle space */}
          <div role="columnheader" style={{ flex: 1, minWidth: '200px' }}>Structure & Activités</div>
          <div role="columnheader" style={{ width: '140px' }}>Responsable</div>
          <div role="columnheader" style={{ width: '120px', textAlign: 'right' }}>Budget (XOF)</div>
          <div role="columnheader" style={{ width: '140px', textAlign: 'center' }}>Progression</div>
          <div role="columnheader" style={{ width: '120px' }}>Statut</div>
          <div role="columnheader" style={{ width: '90px', textAlign: 'right' }}>Actions</div>
        </div>

        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={visibleItems.map(i => i.id)} strategy={verticalListSortingStrategy}>
            <div role="rowgroup">
              {visibleItems.length === 0 ? (
                <div className="empty-state" style={{ padding: '40px 0' }}>
                  <div className="es-title">WBS Vide</div>
                  <div className="es-sub">Ajoutez une première composante pour commencer.</div>
                </div>
              ) : (
                visibleItems.map(node => (
                  <SortableNode 
                    key={node.id} 
                    node={node} 
                    childrenNodes={data.filter(n => n.parent_id === node.id)}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onAddChild={onAddChild}
                    expanded={!!expanded[node.id]}
                    toggleExpand={() => toggleExpand(node.id)}
                  />
                ))
              )}
            </div>
          </SortableContext>
        </DndContext>
      </div>
    </div>
  );
}
