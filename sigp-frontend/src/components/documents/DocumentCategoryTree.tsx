import { useMemo } from 'react';
import { Folder, FolderOpen, Layers } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CategorieGlobalDoc, DocumentGlobal } from '@/types';
import { CATEGORIES_GLOBAL_DOC } from '@/mocks/globalDocumentsMocks';

interface DocumentCategoryTreeProps {
  documents: DocumentGlobal[];
  selected: CategorieGlobalDoc | null;
  onSelect: (cat: CategorieGlobalDoc | null) => void;
}

export function DocumentCategoryTree({ documents, selected, onSelect }: DocumentCategoryTreeProps) {
  const counts = useMemo(() => {
    const map: Partial<Record<CategorieGlobalDoc, number>> = {};
    for (const doc of documents) {
      map[doc.categorie] = (map[doc.categorie] ?? 0) + 1;
    }
    return map;
  }, [documents]);

  const total = documents.length;

  return (
    <div className="flex flex-col gap-0.5 min-w-[200px]">
      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide px-2 pb-1">
        Catégories
      </p>

      {/* Toutes catégories */}
      <button
        onClick={() => onSelect(null)}
        className={cn(
          'flex items-center justify-between gap-2 px-2 py-1.5 rounded-md text-left transition-colors group w-full',
          selected === null
            ? 'bg-primary/10 text-primary font-medium'
            : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
        )}
      >
        <div className="flex items-center gap-2">
          <Layers className="h-3.5 w-3.5 shrink-0" />
          <span className="text-xs truncate">Tous les documents</span>
        </div>
        <span className={cn(
          'text-[10px] font-mono px-1.5 py-0.5 rounded',
          selected === null ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground',
        )}>
          {total}
        </span>
      </button>

      <div className="border-t border-border my-1" />

      {/* Par catégorie */}
      {CATEGORIES_GLOBAL_DOC.map(cat => {
        const count = counts[cat] ?? 0;
        const isActive = selected === cat;
        return (
          <button
            key={cat}
            onClick={() => onSelect(cat)}
            className={cn(
              'flex items-center justify-between gap-2 px-2 py-1.5 rounded-md text-left transition-colors group w-full',
              isActive
                ? 'bg-primary/10 text-primary font-medium'
                : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
              count === 0 && 'opacity-40 pointer-events-none',
            )}
          >
            <div className="flex items-center gap-2">
              {isActive
                ? <FolderOpen className="h-3.5 w-3.5 shrink-0 text-primary" />
                : <Folder className="h-3.5 w-3.5 shrink-0" />
              }
              <span className="text-xs truncate">{cat}</span>
            </div>
            <span className={cn(
              'text-[10px] font-mono px-1.5 py-0.5 rounded shrink-0',
              isActive ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground',
            )}>
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
