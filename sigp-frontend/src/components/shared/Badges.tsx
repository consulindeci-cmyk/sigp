import { cn, getEvmBg } from '@/lib/utils'

interface EVMBadgeProps {
  value: number
  label?: string
  size?: 'sm' | 'md' | 'lg'
}

export function EVMBadge({ value, label, size = 'sm' }: EVMBadgeProps) {
  const colorClass = getEvmBg(value)
  const sizeClass = size === 'lg' ? 'px-3 py-1.5 text-sm font-bold'
    : size === 'md' ? 'px-2.5 py-1 text-xs font-semibold'
    : 'px-2 py-0.5 text-xs font-semibold'

  return (
    <span className={cn('inline-flex items-center rounded border font-mono', colorClass, sizeClass)}>
      {label && <span className="mr-1 opacity-70">{label}:</span>}
      {value.toFixed(2)}
    </span>
  )
}

interface StatusBadgeProps {
  statut: string
  className?: string
}

const STATUT_LABELS: Record<string, string> = {
  ACTIF: 'Actif', PREPARATION: 'Préparation', SUSPENDU: 'Suspendu',
  CLOTURE: 'Clôturé', ANNULE: 'Annulé',
  A_FAIRE: 'À faire', EN_COURS: 'En cours', TERMINE: 'Terminé', EN_ATTENTE: 'En attente',
  FAIBLE: 'Faible', MODERE: 'Modéré', ELEVE: 'Élevé', CRITIQUE: 'Critique',
}

const STATUT_COLORS: Record<string, string> = {
  ACTIF: 'bg-success/10 text-success border-success/30',
  PREPARATION: 'bg-warning/10 text-warning border-warning/30',
  SUSPENDU: 'bg-destructive/10 text-destructive border-destructive/30',
  CLOTURE: 'bg-muted/50 text-muted-foreground border-border',
  ANNULE: 'bg-muted/50 text-muted-foreground border-border line-through',
  A_FAIRE: 'bg-muted/50 text-muted-foreground border-border',
  EN_COURS: 'bg-primary/10 text-primary border-primary/30',
  TERMINE: 'bg-success/10 text-success border-success/30',
  EN_ATTENTE: 'bg-warning/10 text-warning border-warning/30',
  FAIBLE: 'bg-success/10 text-success border-success/30',
  MODERE: 'bg-warning/10 text-warning border-warning/30',
  ELEVE: 'bg-orange-500/10 text-orange-400 border-orange-500/30',
  CRITIQUE: 'bg-destructive/10 text-destructive border-destructive/30',
}

export function StatusBadge({ statut, className }: StatusBadgeProps) {
  return (
    <span className={cn(
      'inline-flex items-center px-1.5 md:px-2 py-0.5 rounded border text-[10px] md:text-xs font-medium',
      STATUT_COLORS[statut] ?? 'bg-muted/50 text-muted-foreground border-border',
      className
    )}>
      {STATUT_LABELS[statut] ?? statut}
    </span>
  )
}
