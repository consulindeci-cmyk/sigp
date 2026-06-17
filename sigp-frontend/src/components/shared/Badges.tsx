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
  ACTIF: 'bg-sigp-green/10 text-sigp-green border-sigp-green/30',
  PREPARATION: 'bg-sigp-yellow/10 text-sigp-yellow border-sigp-yellow/30',
  SUSPENDU: 'bg-sigp-red/10 text-sigp-red border-sigp-red/30',
  CLOTURE: 'bg-navy-500/50 text-sigp-muted border-navy-500',
  ANNULE: 'bg-navy-500/50 text-sigp-muted border-navy-500 line-through',
  A_FAIRE: 'bg-navy-500/50 text-sigp-muted border-navy-500',
  EN_COURS: 'bg-sigp-blue/10 text-sigp-blue border-sigp-blue/30',
  TERMINE: 'bg-sigp-green/10 text-sigp-green border-sigp-green/30',
  EN_ATTENTE: 'bg-sigp-yellow/10 text-sigp-yellow border-sigp-yellow/30',
  FAIBLE: 'bg-sigp-green/10 text-sigp-green border-sigp-green/30',
  MODERE: 'bg-sigp-yellow/10 text-sigp-yellow border-sigp-yellow/30',
  ELEVE: 'bg-orange-500/10 text-orange-400 border-orange-500/30',
  CRITIQUE: 'bg-sigp-red/10 text-sigp-red border-sigp-red/30',
}

export function StatusBadge({ statut, className }: StatusBadgeProps) {
  return (
    <span className={cn(
      'inline-flex items-center px-1.5 md:px-2 py-0.5 rounded border text-[10px] md:text-xs font-medium',
      STATUT_COLORS[statut] ?? 'bg-navy-500/50 text-sigp-muted border-navy-500',
      className
    )}>
      {STATUT_LABELS[statut] ?? statut}
    </span>
  )
}
