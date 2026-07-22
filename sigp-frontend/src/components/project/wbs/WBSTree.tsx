import React, { useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { Edit2, Trash2, Plus, ChevronDown, ChevronRight, AlertTriangle } from 'lucide-react';
import type { WBS } from '@/types';
import { flattenWBSTree } from '@/utils/tree';
import { formatMoney } from '@/utils/format';
import { DataTable } from '@/components/ui/data-table/DataTable';
import { Badge } from '@/components/ui/data-display/Badge';

interface WBSTreeProps {
  data: WBS[];
  onEdit: (node: WBS) => void;
  onDelete: (id: string) => void;
  onAddChild: (parentId: string) => void;
  canManage: boolean;
  canDelete: boolean;
  /** Résout l'UUID responsable (aucune jointure côté hook) en nom affichable
   * — cf. même correctif déjà appliqué au module PTBA. */
  responsableLabels?: Record<string, string>;
}

export function WBSTree({ data, onEdit, onDelete, onAddChild, canManage, canDelete, responsableLabels = {} }: WBSTreeProps) {
  // Tri par défaut par Code WBS croissant (1, 2, 3...) — cf. audit WBS/PTBA,
  // même comparateur numeric-aware que PTBAMatrix.tsx (formatRootCode).
  const rootNodes = useMemo(
    () => data.filter(n => !n.parent_id).sort((a, b) => a.code_wbs.localeCompare(b.code_wbs, undefined, { numeric: true })),
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
        cell: ({ row }) => {
          const node = row.original;
          const label = node.responsable_externe || (node.responsable && responsableLabels[node.responsable]) || '—';
          return (
            <span className="text-sm text-muted-foreground truncate">
              {label}
            </span>
          );
        },
      },
      {
        accessorKey: 'budget_alloue',
        header: 'BUDGET',
        size: 180,
        meta: { align: 'right' },
        cell: ({ row }) => {
          const node = row.original;
          // Plafond bailleur : composantes racine uniquement (cf. WBSNodeForm).
          const plafond = node.niveau === 1 ? node.enveloppe_cible ?? null : null;
          const budget = node.budget_alloue ?? 0;
          const isOverBudget = plafond != null && budget > plafond;
          return (
            <div className="flex flex-col items-end gap-0.5">
              <span className={`font-semibold text-sm tabular-nums ${isOverBudget ? 'text-destructive' : 'text-foreground'}`}>
                {formatMoney(budget)}
              </span>
              {plafond != null && (
                <span className={`text-[11px] tabular-nums ${isOverBudget ? 'text-destructive font-semibold' : 'text-muted-foreground'}`}>
                  Plafond : {formatMoney(plafond)}
                </span>
              )}
              {isOverBudget && (
                <Badge variant="destructive" className="text-[9px] px-1.5 py-0 gap-1 font-normal mt-0.5">
                  <AlertTriangle className="h-2.5 w-2.5" />
                  Dépassement de {formatMoney(budget - plafond!)}
                </Badge>
              )}
            </div>
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

          return (
            <div className="flex items-center justify-end gap-1">
              {/* Structure à 2 niveaux uniquement (composante racine + sous-
                  éléments) — cf. alignement WBS/Matrice PTBA : un sous-élément
                  ne peut pas avoir son propre sous-élément (cf. wbs-create/
                  wbs-update, qui refusent désormais cette création). */}
              {canManage && node.niveau === 1 && (
                <button
                  onClick={e => { e.stopPropagation(); onAddChild(node.id); }}
                  className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label="Ajouter un sous-élément"
                  title="Ajouter sous-élément"
                >
                  <Plus size={16} />
                </button>
              )}
              {canManage && (
                <button
                  onClick={e => { e.stopPropagation(); onEdit(node); }}
                  className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label={`Modifier ${node.titre}`}
                  title="Modifier"
                >
                  <Edit2 size={16} />
                </button>
              )}
              {canDelete && (
                <button
                  onClick={e => { e.stopPropagation(); onDelete(node.id); }}
                  className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label={`Supprimer ${node.titre}`}
                  title="Supprimer"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          );
        },
      },
    ],
    [data, expanded, flatItems, canManage, canDelete, responsableLabels]
  );

  return (
    <div className="w-full flex flex-col min-h-[400px]">
      <DataTable columns={columns} data={visibleItems} />
    </div>
  );
}
