import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: number | string, devise = 'XOF'): string {
  const num = typeof value === 'string' ? parseFloat(value) : value
  if (isNaN(num)) return '—'
  
  const abs = Math.abs(num)
  let formatted = ''
  
  if (abs >= 1_000_000_000) {
    formatted = (num / 1_000_000_000).toFixed(1).replace('.0', '') + ' Md'
  } else if (abs >= 1_000_000) {
    formatted = (num / 1_000_000).toFixed(1).replace('.0', '') + ' M'
  } else if (abs >= 100_000) {
    formatted = (num / 1_000).toFixed(0) + ' k'
  } else {
    formatted = new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num)
  }
  
  const finalDevise = devise === 'XOF' ? 'FCFA' : devise
  return `${formatted} ${finalDevise}`
}

export function formatNumber(value: number, decimals = 2): string {
  if (isNaN(value)) return '—'
  
  const abs = Math.abs(value)
  if (abs >= 1_000_000_000) {
    return (value / 1_000_000_000).toFixed(1).replace('.0', '') + ' Md'
  } else if (abs >= 1_000_000) {
    return (value / 1_000_000).toFixed(1).replace('.0', '') + ' M'
  } else if (abs >= 100_000) {
    return (value / 1_000).toFixed(0) + ' k'
  }
  
  return new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value)
}

export function formatPercent(value: number): string {
  return `${Math.round(value)}%`
}

export function getEvmBg(value: number): string {
  if (value >= 1.0) return 'bg-success/10 text-success'
  if (value >= 0.9) return 'bg-warning/10 text-warning'
  return 'bg-destructive/10 text-destructive'
}

export function getStatutColor(statut: string): string {
  const map: Record<string, string> = {
    ACTIF: 'bg-success/10 text-success border-success/30',
    PREPARATION: 'bg-warning/10 text-warning border-warning/30',
    SUSPENDU: 'bg-destructive/10 text-destructive border-destructive/30',
    CLOTURE: 'bg-muted/50 text-muted-foreground border-border',
    ANNULE: 'bg-muted/50 text-muted-foreground border-border',
    A_FAIRE: 'bg-muted/50 text-muted-foreground border-border',
    EN_COURS: 'bg-primary/10 text-primary border-primary/30',
    TERMINE: 'bg-success/10 text-success border-success/30',
    EN_ATTENTE: 'bg-warning/10 text-warning border-warning/30',
  }
  return map[statut] ?? 'bg-muted/50 text-muted-foreground border-border'
}

export function formatDate(date: string | null | undefined): string {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('fr-FR', {
    day: '2-digit', month: 'short', year: '2-digit',
  }).replace('.', '')
}

export function truncate(str: string, n = 40): string {
  return str.length > n ? str.slice(0, n) + '…' : str
}
