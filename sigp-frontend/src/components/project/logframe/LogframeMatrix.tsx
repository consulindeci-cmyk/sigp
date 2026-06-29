import React, { useMemo, useState } from 'react';
import { Edit2, Trash2, Plus, ChevronDown, ChevronRight, Link2, LayoutList } from 'lucide-react';
import type { CadreLogique } from '@/types';
import { flattenLogframeHierarchy } from '@/utils/tree';
import { Badge } from '@/components/ui/data-display/Badge';

interface LogframeMatrixProps {
  data: CadreLogique[];
  onEdit: (item: CadreLogique) => void;
  onDelete: (id: string) => void;
  onAddChild: (parentId: string, parentLevel: string) => void;
}

type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'warning' | 'success' | 'info' | 'outline';

function getNiveauBadgeVariant(niveau: string): BadgeVariant {
  switch (niveau) {
    case 'IMPACT':   return 'info';
    case 'OBJECTIF': return 'default';
    case 'RESULTAT': return 'warning';
    case 'PRODUIT':  return 'success';
    case 'ACTIVITE': return 'secondary';
    default:         return 'default';
  }
}

function getNiveauLabel(niveau: string): string {
  switch (niveau) {
    case 'IMPACT':   return 'Impact';
    case 'OBJECTIF': return 'Objectif';
    case 'RESULTAT': return 'Résultat';
    case 'PRODUIT':  return 'Produit';
    case 'ACTIVITE': return 'Activité';
    default:         return niveau;
  }
}

export function LogframeMatrix({ data, onEdit, onDelete, onAddChild }: LogframeMatrixProps) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

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

  const rootNodes = useMemo(() => data.filter(n => !n.parent_id), [data]);
  const flatItems = useMemo(() => flattenLogframeHierarchy(rootNodes, data), [rootNodes, data]);

  const visibleItems = useMemo(() => {
    return flatItems.filter(item => {
      let current = item as CadreLogique;
      while (current.parent_id) {
        if (!expanded[current.parent_id]) return false;
        const parent = data.find(n => n.id === current.parent_id);
        if (!parent || parent.id === item.id) break;
        current = parent;
      }
      return true;
    });
  }, [flatItems, expanded, data]);

  if (visibleItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
          <LayoutList className="w-6 h-6 text-muted-foreground" />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">Matrice vide</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Commencez par définir un Impact.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto" role="table" aria-label="Matrice du Cadre Logique">

      {/* Entête colonnes */}
      <div
        role="row"
        className="flex items-center px-3.5 py-2.5 bg-muted/30 border-b border-border text-[11px] font-semibold uppercase tracking-wide text-muted-foreground"
        style={{ minWidth: '1000px' }}
      >
        <div role="columnheader" className="w-9 shrink-0" />
        <div role="columnheader" className="w-28 shrink-0">Niveau</div>
        <div role="columnheader" className="flex-1 min-w-[200px]">Description / Indicateur (IOV)</div>
        <div role="columnheader" className="w-28 shrink-0">Baseline</div>
        <div role="columnheader" className="w-28 shrink-0">Cible</div>
        <div role="columnheader" className="w-36 shrink-0">Source vérif.</div>
        <div role="columnheader" className="w-36 shrink-0">Hypothèses</div>
        <div role="columnheader" className="w-24 shrink-0 text-right">Actions</div>
      </div>

      {/* Corps */}
      <div role="rowgroup" style={{ minWidth: '1000px' }}>
        {visibleItems.map(item => {
          const hasChildren = data.some(n => n.parent_id === item.id);
          const isActivite  = item.niveau_intervention === 'ACTIVITE';
          const isExpanded  = !!expanded[item.id];

          return (
            <div
              role="row"
              key={item.id}
              className="flex items-start px-3.5 py-3 border-b border-border/60 bg-card hover:bg-muted/20 transition-colors"
            >
              {/* Expand/collapse avec indentation dynamique */}
              <div
                role="cell"
                className="w-9 shrink-0 flex items-center justify-end pr-1 mt-0.5"
                style={{ paddingLeft: `${item.level * 20}px` }}
              >
                {hasChildren ? (
                  <button
                    onClick={() => toggleExpand(item.id)}
                    aria-label={isExpanded ? 'Réduire' : 'Développer'}
                    aria-expanded={isExpanded}
                    className="text-muted-foreground hover:text-foreground p-0.5 rounded-sm hover:bg-muted/50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  </button>
                ) : (
                  <div className="w-1.5 h-1.5 rounded-full bg-border" />
                )}
              </div>

              {/* Badge niveau */}
              <div role="cell" className="w-28 shrink-0 mt-0.5">
                <Badge variant={getNiveauBadgeVariant(item.niveau_intervention)}>
                  {getNiveauLabel(item.niveau_intervention)}
                </Badge>
              </div>

              {/* Indicateur / Description */}
              <div role="cell" className="flex-1 min-w-[200px] pr-4">
                <p
                  className={`text-sm leading-snug ${
                    isActivite ? 'text-muted-foreground' : 'font-medium text-foreground'
                  }`}
                >
                  {item.indicateur}
                </p>
              </div>

              {/* Baseline */}
              <div role="cell" className="w-28 shrink-0 text-sm text-muted-foreground pr-3">
                {item.valeur_reference || <span className="text-muted-foreground/40">—</span>}
              </div>

              {/* Cible */}
              <div role="cell" className="w-28 shrink-0 text-sm text-muted-foreground pr-3">
                {item.cible || <span className="text-muted-foreground/40">—</span>}
              </div>

              {/* Source vérification */}
              <div role="cell" className="w-36 shrink-0 text-xs text-muted-foreground leading-snug pr-3">
                {item.source_verification || <span className="text-muted-foreground/40">—</span>}
              </div>

              {/* Hypothèses */}
              <div role="cell" className="w-36 shrink-0 text-xs text-muted-foreground leading-snug">
                {item.hypotheses || <span className="text-muted-foreground/40">—</span>}
              </div>

              {/* Actions */}
              <div role="cell" className="w-24 shrink-0 flex items-center justify-end gap-0.5">
                {!isActivite && (
                  <button
                    onClick={() => onAddChild(item.id, item.niveau_intervention)}
                    title="Ajouter un sous-élément"
                    aria-label="Ajouter un sous-élément"
                    className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <Plus size={14} />
                  </button>
                )}
                {isActivite && (
                  <button
                    title="Lier à une composante WBS"
                    aria-label="Lier au WBS"
                    className="p-1.5 text-muted-foreground hover:text-info hover:bg-info/10 rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <Link2 size={14} />
                  </button>
                )}
                <button
                  onClick={() => onEdit(item)}
                  title="Modifier"
                  aria-label={`Modifier ${item.indicateur}`}
                  className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <Edit2 size={14} />
                </button>
                <button
                  onClick={() => onDelete(item.id)}
                  title="Supprimer"
                  aria-label={`Supprimer ${item.indicateur}`}
                  className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <Trash2 size={14} />
                </button>
              </div>

            </div>
          );
        })}
      </div>
    </div>
  );
}
