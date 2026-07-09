import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

export function Loader({
  className,
  fullScreen = false,
  fullWidth = false,
  text,
}: {
  className?: string;
  fullScreen?: boolean;
  fullWidth?: boolean;
  text?: string;
}) {
  const wrapperClasses = cn(
    'flex flex-col items-center justify-center gap-3',
    fullScreen && 'fixed inset-0 z-50 bg-background/80 backdrop-blur-sm',
    fullWidth && 'w-full flex-1 min-h-[200px]',
    className
  );

  return (
    <div className={wrapperClasses}>
      <Loader2 className="w-8 h-8 text-primary animate-spin" />
      {text && <span className="text-sm font-medium text-muted-foreground animate-pulse">{text}</span>}
    </div>
  );
}
