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

export function getEvmColor(value: number): string {
  if (value >= 1.0) return 'evm-green'
  if (value >= 0.9) return 'evm-orange'
  return 'evm-red'
}

export function getEvmBg(value: number): string {
  if (value >= 1.0) return 'bg-sigp-green/10 text-sigp-green'
  if (value >= 0.9) return 'bg-sigp-yellow/10 text-sigp-yellow'
  return 'bg-sigp-red/10 text-sigp-red'
}

export function getStatutColor(statut: string): string {
  const map: Record<string, string> = {
    ACTIF: 'bg-sigp-green/10 text-sigp-green border-sigp-green/30',
    PREPARATION: 'bg-sigp-yellow/10 text-sigp-yellow border-sigp-yellow/30',
    SUSPENDU: 'bg-sigp-red/10 text-sigp-red border-sigp-red/30',
    CLOTURE: 'bg-navy-500/50 text-sigp-muted border-navy-500',
    ANNULE: 'bg-navy-500/50 text-sigp-muted border-navy-500',
    A_FAIRE: 'bg-navy-500/50 text-sigp-muted border-navy-500',
    EN_COURS: 'bg-sigp-blue/10 text-sigp-blue border-sigp-blue/30',
    TERMINE: 'bg-sigp-green/10 text-sigp-green border-sigp-green/30',
    EN_ATTENTE: 'bg-sigp-yellow/10 text-sigp-yellow border-sigp-yellow/30',
  }
  return map[statut] ?? 'bg-navy-500/50 text-sigp-muted border-navy-500'
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
