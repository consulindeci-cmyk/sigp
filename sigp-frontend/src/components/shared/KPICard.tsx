import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface KPICardProps {
  label: string
  value: string | number
  subtitle?: string
  icon?: LucideIcon
  trend?: 'up' | 'down' | 'neutral'
  trendValue?: string
  color?: 'default' | 'green' | 'yellow' | 'red' | 'blue'
  className?: string
}

const colorMap = {
  default: 'text-sigp-text',
  green: 'text-sigp-green',
  yellow: 'text-sigp-yellow',
  red: 'text-sigp-red',
  blue: 'text-sigp-blue',
}

const iconBgMap = {
  default: 'bg-navy-600',
  green: 'bg-sigp-green/10',
  yellow: 'bg-sigp-yellow/10',
  red: 'bg-sigp-red/10',
  blue: 'bg-sigp-blue/10',
}

export function KPICard({
  label,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendValue,
  color = 'default',
  className,
}: KPICardProps) {
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus
  const trendColor =
    trend === 'up' ? 'text-sigp-green' : trend === 'down' ? 'text-sigp-red' : 'text-sigp-muted'

  return (
    <div className={cn('kpi-card flex flex-col gap-3', className)}>
      <div className="flex items-start justify-between">
        <p className="text-xs text-sigp-muted uppercase tracking-wider font-medium">{label}</p>
        {Icon && (
          <div className={cn('p-2 rounded-lg', iconBgMap[color])}>
            <Icon size={16} className={colorMap[color]} />
          </div>
        )}
      </div>

      <div>
        <p className={cn('text-2xl font-bold tracking-tight', colorMap[color])}>{value}</p>
        {subtitle && <p className="text-xs text-sigp-muted mt-0.5">{subtitle}</p>}
      </div>

      {trend && trendValue && (
        <div className={cn('flex items-center gap-1 text-xs', trendColor)}>
          <TrendIcon size={12} />
          <span>{trendValue}</span>
        </div>
      )}
    </div>
  )
}
