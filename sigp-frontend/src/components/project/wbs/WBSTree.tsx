import React, { useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { Edit2, Trash2, Plus, ChevronDown, ChevronRight, ArrowUp, ArrowDown } from 'lucide-react';
import type { WBS } from '@/types';
import { flattenWBSTree } from '@/utils/tree';
import { DataTable } from '@/components/ui/data-table/DataTable';
import { Badge } from '@/components/ui/data-display/Badge';
import { ProgressBar } from '@/components/ui/data-display/ProgressBar';

interface WBSTreeProps {
  data: WBS[];
  onReorder: (items: WBS[]) => void;
  onEdit: (node: WBS) => void;
  onDelete: (id: string) => void;
  onAddChild: (parentId: string) => void;
}

function getStatusBadgeVariant(statut: string): 'default' | 'info' | 'success' | 'destructive' | 'secondary' {
  switch (statut) {
    case 'NON_COMMENCE': return 'default';
    case 'EN_COURS':     return 'info';
    case 'TERMINE':      return 'success';
    case 'EN_RETARD':    return 'destructive';
    case 'ANNULE':       return 'secondary';
    default:             return 'default';
  }
}

function getStatusLabel(statut: string): string {
  switch (statut) {
    case 'NON_COMMENCE': return 'Non commencé';
    case 'EN_COURS':     return 'En cours';
    case 'TERMINE':      return 'Terminé';
    case 'EN_RETARD':    return 'En retard';
    case 'ANNULE':       return 'Annulé';
    default:             return 'Non commencé';
  }
}

function getProgressColor(pct: number): 'success' | 'primary' | 'warning' | 'destructive' {
  if (pct === 100) return 'success';
  if (pct >= 60)   return 'primary';
  if (pct >= 20)   return 'warning';
  return 'destructive';
}

const formatMoney = (amount: number = 0) =>
  new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'XOF',
    maximumFractionDigits: 0,
  }).format(amount);

export function WBSTree({ data, onReorder, onEdit, onDelete, onAddChild }: WBSTreeProps) {
  const rootNodes = useMemo(
    () => data.filter(n => !n.parent_id).sort((a, b) => a.ordre - b.ordre),
    [data]
  );
  const flatItems = useMemo(() => flattenWBSTree(rootNodes, data), [rootNodes, data]);

  const [expanded, setExpanded] = React.useState<Record<string, boolean>>({});

  React.useEffect(() => {
    const initialExp = data.reduce(
      (acc, curr) => ({ ...acc, [curr.id]: true }),
      {} as Record<string, boolean>
    );
    setExpanded(initialExp);
  }, [data]);

  const toggleExpand = (id: string) => {
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleMoveUp = (node: WBS) => {
    const siblings = flatItems.filter(item => item.parent_id === node.parent_id);
    const currentIndex = siblings.findIndex(item => item.id === node.id);
    if (currentIndex > 0) {
      const prevSibling = siblings[currentIndex - 1];
      const flatIndexCurrent = flatItems.findIndex(i => i.id === node.id);
      const flatIndexPrev = flatItems.findIndex(i => i.id === prevSibling.id);
      const newItems = [...flatItems];
      [newItems[flatIndexCurrent], newItems[flatIndexPrev]] = [newItems[flatIndexPrev], newItems[flatIndexCurrent]];
      onReorder(newItems);
    }
  };

  const handleMoveDown = (node: WBS) => {
    const siblings = flatItems.filter(item => item.parent_id === node.parent_id);
    const currentIndex = siblings.findIndex(item => item.id === node.id);
    if (currentIndex < siblings.length - 1) {
      const nextSibling = siblings[currentIndex + 1];
      const flatIndexCurrent = flatItems.findIndex(i => i.id === node.id);
      const flatIndexNext = flatItems.findIndex(i => i.id === nextSibling.id);
      const newItems = [...flatItems];
      [newItems[flatIndexCurrent], newItems[flatIndexNext]] = [newItems[flatIndexNext], newItems[flatIndexCurrent]];
      onReorder(newItems);
    }
  };

  const visibleItems = useMemo(() => {
    return flatItems.filter(item => {
      let current = item;
      while (current.parent_id) {
        if (!expanded[current.parent_id]) return false;
        const parent = data.find(n => n.id === current.parent_id);
        if (!parent || parent.id === item.id) break;
        current = parent;
      }
      return true;
    });
  }, [flatItems, expanded, data]);

  const columns = useMemo<ColumnDef<WBS>[]>(
    () => [
      {
        id: 'structure',
        header: 'STRUCTURE & ACTIVITÉS',
        size: 320,
        cell: ({ row }) => {
          const node = row.original;
          const indentLevel = node.niveau - 1;
          const hasChildren = data.some(n => n.parent_id === node.id);
          const isExpanded = !!expanded[node.id];

          return (
            <div
              className="flex items-center gap-2"
              style={{ paddingLeft: `${indentLevel * 24}px` }}
            >
              <div className="w-5 flex items-center justify-center shrink-0">
                {hasChildren ? (
                  <button
                    onClick={e => { e.stopPropagation(); toggleExpand(node.id); }}
                    className="text-muted-foreground hover:text-foreground p-0.5 rounded-sm hover:bg-muted/50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    aria-label={isExpanded ? 'Réduire' : 'Développer'}
                    aria-expanded={isExpanded}
                  >
                    {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  </button>
                ) : (
                  <div className="w-1.5 h-1.5 rounded-full bg-border" />
                )}
              </div>
              <div className="flex items-center gap-2 min-w-0">
                <span className="font-mono text-xs font-medium text-muted-foreground shrink-0">
                  {node.code_wbs}
                </span>
                <span
                  className={
                    node.niveau === 1
                      ? 'truncate font-semibold text-foreground'
                      : 'truncate font-medium text-foreground/90 text-sm'
                  }
                >
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
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground truncate">
            {row.original.responsable || '—'}
          </span>
        ),
      },
      {
        accessorKey: 'budget_alloue',
        header: 'BUDGET (XOF)',
        size: 140,
        meta: { align: 'right' },
        cell: ({ row }) => (
          <span className="font-semibold text-foreground text-sm tabular-nums">
            {formatMoney(row.original.budget_alloue)}
          </span>
        ),
      },
      {
        accessorKey: 'progression_physique',
        header: 'PROGRESSION',
        size: 160,
        meta: { align: 'center' },
        cell: ({ row }) => {
          const prog = Math.round(row.original.progression_physique || 0);
          return (
            <div className="w-full max-w-[130px] mx-auto">
              <ProgressBar
                value={prog}
                color={getProgressColor(prog)}
                size="xs"
                showLabel
                aria-label={`Progression : ${prog}%`}
              />
            </div>
          );
        },
      },
      {
        accessorKey: 'statut',
        header: 'STATUT',
        size: 130,
        cell: ({ row }) => {
          const statut = row.original.statut || 'NON_COMMENCE';
          return (
            <Badge variant={getStatusBadgeVariant(statut)}>
              {getStatusLabel(statut)}
            </Badge>
          );
        },
      },
      {
        id: 'actions',
        header: 'ACTIONS',
        size: 130,
        meta: { align: 'right', isStickyRight: true },
        cell: ({ row }) => {
          const node = row.original;
          const siblings = flatItems.filter(item => item.parent_id === node.parent_id);
          const currentIndex = siblings.findIndex(item => item.id === node.id);
          const canMoveUp = currentIndex > 0;
          const canMoveDown = currentIndex < siblings.length - 1;

          return (
            <div className="flex items-center justify-end gap-1">
              <div className="flex flex-col gap-0.5 mr-1">
                <button
                  onClick={e => { e.stopPropagation(); handleMoveUp(node); }}
                  disabled={!canMoveUp}
                  className="text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors p-0.5 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring rounded-sm"
                  aria-label="Monter"
                  title="Monter"
                >
                  <ArrowUp size={12} strokeWidth={3} />
                </button>
                <button
                  onClick={e => { e.stopPropagation(); handleMoveDown(node); }}
                  disabled={!canMoveDown}
                  className="text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors p-0.5 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring rounded-sm"
                  aria-label="Descendre"
                  title="Descendre"
                >
                  <ArrowDown size={12} strokeWidth={3} />
                </button>
              </div>

              <button
                onClick={e => { e.stopPropagation(); onAddChild(node.id); }}
                className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label="Ajouter un sous-élément"
                title="Ajouter sous-élément"
              >
                <Plus size={16} />
              </button>
              <button
                onClick={e => { e.stopPropagation(); onEdit(node); }}
                className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label={`Modifier ${node.titre}`}
                title="Modifier"
              >
                <Edit2 size={16} />
              </button>
              <button
                onClick={e => { e.stopPropagation(); onDelete(node.id); }}
                className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label={`Supprimer ${node.titre}`}
                title="Supprimer"
              >
                <Trash2 size={16} />
              </button>
            </div>
          );
        },
      },
    ],
    [data, expanded, flatItems]
  );

  return (
    <div className="w-full flex flex-col min-h-[400px]">
      <DataTable columns={columns} data={visibleItems} />
    </div>
  );
}
