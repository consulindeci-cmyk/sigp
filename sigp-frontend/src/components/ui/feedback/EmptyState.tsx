import { cn } from '@/lib/utils';
import { Ghost, FolderOpen, SearchX } from 'lucide-react';
import { ReactNode } from 'react';

type EmptyStateVariant = 'default' | 'folder' | 'search';

interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: ReactNode;
  variant?: EmptyStateVariant;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({
  title = "Aucune donnée",
  description = "Il n'y a rien à afficher pour le moment.",
  icon,
  variant = 'default',
  action,
  className,
}: EmptyStateProps) {
  const IconComponent = icon ? () => <>{icon}</> : 
    variant === 'folder' ? FolderOpen : 
    variant === 'search' ? SearchX : Ghost;

  return (
    <div className={cn(
      "flex flex-col items-center justify-center p-8 text-center min-h-[250px] w-full",
      "bg-muted/10 border border-dashed border-border rounded-lg",
      className
    )}>
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted/50 mb-4">
        <IconComponent className="h-6 w-6 text-muted-foreground" aria-hidden="true" />
      </div>
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground max-w-sm mb-4">
        {description}
      </p>
      {action && <div>{action}</div>}
    </div>
  );
}
