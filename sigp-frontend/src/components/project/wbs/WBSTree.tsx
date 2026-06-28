import React, { useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { Edit2, Trash2, Plus, ChevronDown, ChevronRight, ArrowUp, ArrowDown } from 'lucide-react';
import type { WBS } from '@/types';
import { flattenWBSTree } from '@/utils/tree';
import { DataTable } from '@/components/ui/data-table/DataTable';
import { Badge } from '@/components/ui/data-display/Badge';

interface WBSTreeProps {
  data: WBS[];
  onReorder: (items: WBS[]) => void;
  onEdit: (node: WBS) => void;
  onDelete: (id: string) => void;
  onAddChild: (parentId: string) => void;
}

const getStatusBadgeVariant = (statut: string) => {
  switch (statut) {
    case 'NON_COMMENCE': return 'default';
    case 'EN_COURS': return 'primary';
    case 'TERMINE': return 'success';
    case 'EN_RETARD': return 'destructive';
    case 'ANNULE': return 'secondary';
    default: return 'default';
  }
};

const getStatusLabel = (statut: string) => {
  switch (statut) {
    case 'NON_COMMENCE': return 'Non commencé';
    case 'EN_COURS': return 'En cours';
    case 'TERMINE': return 'Terminé';
    case 'EN_RETARD': return 'En retard';
    case 'ANNULE': return 'Annulé';
    default: return 'Non commencé';
  }
};

export function WBSTree({ data, onReorder, onEdit, onDelete, onAddChild }: WBSTreeProps) {
  const rootNodes = useMemo(() => data.filter(n => !n.parent_id).sort((a, b) => a.ordre - b.ordre), [data]);
  const flatItems = useMemo(() => flattenWBSTree(rootNodes, data), [rootNodes, data]);
  
  const [expanded, setExpanded] = React.useState<Record<string, boolean>>({});
  
  React.useEffect(() => {
    const initialExp = data.reduce((acc, curr) => ({...acc, [curr.id]: true}), {} as Record<string, boolean>);
    setExpanded(initialExp);
  }, [data]);

  const toggleExpand = (id: string) => {
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleMoveUp = (node: WBS) => {
    const parentId = node.parent_id;
    const siblings = flatItems.filter(item => item.parent_id === parentId);
    const currentIndex = siblings.findIndex(item => item.id === node.id);
    
    if (currentIndex > 0) {
      const prevSibling = siblings[currentIndex - 1];
      const flatIndexCurrent = flatItems.findIndex(i => i.id === node.id);
      const flatIndexPrev = flatItems.findIndex(i => i.id === prevSibling.id);
      
      const newItems = [...flatItems];
      // Swap their positions in the flat array
      const temp = newItems[flatIndexCurrent];
      newItems[flatIndexCurrent] = newItems[flatIndexPrev];
      newItems[flatIndexPrev] = temp;
      
      onReorder(newItems);
    }
  };

  const handleMoveDown = (node: WBS) => {
    const parentId = node.parent_id;
    const siblings = flatItems.filter(item => item.parent_id === parentId);
    const currentIndex = siblings.findIndex(item => item.id === node.id);
    
    if (currentIndex < siblings.length - 1) {
      const nextSibling = siblings[currentIndex + 1];
      const flatIndexCurrent = flatItems.findIndex(i => i.id === node.id);
      const flatIndexNext = flatItems.findIndex(i => i.id === nextSibling.id);
      
      const newItems = [...flatItems];
      const temp = newItems[flatIndexCurrent];
      newItems[flatIndexCurrent] = newItems[flatIndexNext];
      newItems[flatIndexNext] = temp;
      
      onReorder(newItems);
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

  const formatMoney = (amount: number = 0) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', maximumFractionDigits: 0 }).format(amount);
  };

  const columns = useMemo<ColumnDef<WBS>[]>(() => [
    {
      id: 'structure',
      header: 'STRUCTURE & ACTIVITÉS',
      size: 300,
      cell: ({ row }) => {
        const node = row.original;
        const indentLevel = node.niveau - 1;
        const childrenNodes = data.filter(n => n.parent_id === node.id);
        const hasChildren = childrenNodes.length > 0;
        const isExpanded = !!expanded[node.id];

        return (
          <div className="flex items-center gap-2" style={{ paddingLeft: `${indentLevel * 24}px` }}>
            <div className="w-5 flex items-center justify-center shrink-0">
              {hasChildren ? (
                <button 
                  onClick={(e) => { e.stopPropagation(); toggleExpand(node.id); }}
                  className="text-muted-foreground hover:text-foreground p-0.5 rounded-sm hover:bg-muted/50 transition-colors"
                >
                  {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </button>
              ) : (
                <div className="w-1.5 h-1.5 rounded-full bg-border" />
              )}
            </div>
            <div className="flex items-center gap-2 min-w-0">
              <span className="font-mono text-xs font-medium text-muted-foreground shrink-0">{node.code_wbs}</span>
              <span className={`truncate ${node.niveau === 1 ? 'font-semibold text-foreground' : 'font-medium text-foreground/90'}`}>
                {node.titre}
              </span>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'responsable',
      header: 'RESPONSABLE',
      size: 150,
      cell: ({ row }) => {
        const resp = row.original.responsable;
        return <span className="text-muted-foreground truncate">{resp || '—'}</span>;
      }
    },
    {
      accessorKey: 'budget_alloue',
      header: 'BUDGET (XOF)',
      size: 120,
      meta: { align: 'right' },
      cell: ({ row }) => {
        return <span className="font-semibold text-foreground">{formatMoney(row.original.budget_alloue)}</span>;
      }
    },
    {
      accessorKey: 'progression_physique',
      header: 'PROGRESSION',
      size: 140,
      meta: { align: 'center' },
      cell: ({ row }) => {
        const prog = Math.round(row.original.progression_physique || 0);
        return (
          <div className="flex items-center gap-2 w-full max-w-[120px] mx-auto">
            <div className="h-1.5 flex-1 bg-muted rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full ${prog === 100 ? 'bg-success' : 'bg-primary'}`} 
                style={{ width: `${prog}%` }} 
              />
            </div>
            <span className="text-xs font-medium text-muted-foreground w-8 text-right">{prog}%</span>
          </div>
        );
      }
    },
    {
      accessorKey: 'statut',
      header: 'STATUT',
      size: 120,
      cell: ({ row }) => {
        const statut = row.original.statut || 'NON_COMMENCE';
        return (
          <Badge variant={getStatusBadgeVariant(statut) as any}>
            {getStatusLabel(statut)}
          </Badge>
        );
      }
    },
    {
      id: 'actions',
      header: 'ACTIONS',
      size: 120,
      meta: { align: 'right', isStickyRight: true },
      cell: ({ row }) => {
        const node = row.original;
        const parentId = node.parent_id;
        const siblings = flatItems.filter(item => item.parent_id === parentId);
        const currentIndex = siblings.findIndex(item => item.id === node.id);
        
        const canMoveUp = currentIndex > 0;
        const canMoveDown = currentIndex < siblings.length - 1;

        return (
          <div className="flex items-center justify-end gap-1">
            <div className="flex flex-col gap-0.5 mr-2">
              <button 
                onClick={(e) => { e.stopPropagation(); handleMoveUp(node); }}
                disabled={!canMoveUp}
                className="text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:hover:text-muted-foreground transition-colors p-0.5"
                title="Monter"
              >
                <ArrowUp size={12} strokeWidth={3} />
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); handleMoveDown(node); }}
                disabled={!canMoveDown}
                className="text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:hover:text-muted-foreground transition-colors p-0.5"
                title="Descendre"
              >
                <ArrowDown size={12} strokeWidth={3} />
              </button>
            </div>

            <button 
              onClick={(e) => { e.stopPropagation(); onAddChild(node.id); }}
              className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-md transition-colors"
              title="Ajouter sous-élément"
            >
              <Plus size={16} />
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); onEdit(node); }}
              className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
              title="Modifier"
            >
              <Edit2 size={16} />
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); onDelete(node.id); }}
              className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors"
              title="Supprimer"
            >
              <Trash2 size={16} />
            </button>
          </div>
        );
      }
    }
  ], [data, expanded, flatItems]);

  return (
    <div className="w-full flex flex-col min-h-[400px]">
      <DataTable 
        columns={columns}
        data={visibleItems}
      />
    </div>
  );
}
