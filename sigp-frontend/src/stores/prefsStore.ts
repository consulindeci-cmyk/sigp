import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// ── Types ──────────────────────────────────────────────────────
export type Theme = 'dark' | 'light' | 'auto'

export interface PrefsRegion {
  lang: string
  timezone: string
  dateFormat: string
  timeFormat: string
  currency: string
  numberFormat: string
}

export interface PrefsDisplay {
  homePage: string
  density: string
  pagination: string
}

export interface PrefsA11y {
  reduceMotion: boolean
  highContrast: boolean
  textSize: string
}

export interface NotifAlert {
  enabled: boolean
  threshold?: string
  channels: { email: boolean; push: boolean }
  frequency: string
}

export interface NotifsDnd {
  enabled: boolean
  start: string
  end: string
  days: string[]
}

export interface NotifsState {
  channels: { email: boolean; push: boolean; sms: boolean }
  emailFreq: string
  alerts: {
    budget: NotifAlert
    tresorerie: NotifAlert
    validations: NotifAlert
    rapports: NotifAlert
    risques: NotifAlert
    echeances: NotifAlert
    mentions: NotifAlert
  }
  dnd: NotifsDnd
}

export interface PrefsState {
  theme: Theme
  region: PrefsRegion
  display: PrefsDisplay
  a11y: PrefsA11y
  notifs: NotifsState
  setTheme: (theme: Theme) => void
  setPrefs: (prefs: Partial<Omit<PrefsState, 'setTheme' | 'setPrefs' | 'setNotifs'>>) => void
  setNotifs: (notifs: NotifsState) => void
}

// ── Default values ─────────────────────────────────────────────
const defaultNotifs: NotifsState = {
  channels: { email: true, push: true, sms: false },
  emailFreq: 'Immédiat',
  alerts: {
    budget:      { enabled: true,  threshold: '5%', channels: { email: true,  push: true  }, frequency: 'Immédiat'     },
    tresorerie:  { enabled: true,                   channels: { email: true,  push: false }, frequency: 'Immédiat'     },
    validations: { enabled: true,                   channels: { email: true,  push: true  }, frequency: 'Quotidien'    },
    rapports:    { enabled: false,                  channels: { email: true,  push: false }, frequency: 'Hebdomadaire' },
    risques:     { enabled: true,                   channels: { email: true,  push: true  }, frequency: 'Immédiat'     },
    echeances:   { enabled: false,                  channels: { email: false, push: false }, frequency: 'Quotidien'    },
    mentions:    { enabled: true,                   channels: { email: false, push: true  }, frequency: 'Immédiat'     },
  },
  dnd: { enabled: false, start: '21:00', end: '08:00', days: ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven'] },
}

// ── Store ──────────────────────────────────────────────────────
export const usePrefsStore = create<PrefsState>()(
  persist(
    (set) => ({
      theme: 'dark',
      region: {
        lang: 'fr',
        timezone: 'UTC+0 - Abidjan',
        dateFormat: 'JJ/MM/AAAA',
        timeFormat: '24h',
        currency: 'XOF (Franc CFA)',
        numberFormat: '1 234 567,89',
      },
      display: {
        homePage: 'Tableau de bord',
        density: 'Confortable',
        pagination: '25',
      },
      a11y: {
        reduceMotion: false,
        highContrast: false,
        textSize: 'Standard',
      },
      notifs: defaultNotifs,

      setTheme: (theme) => set({ theme }),
      setPrefs: (partial) => set((s) => ({ ...s, ...partial })),
      setNotifs: (notifs) => set({ notifs }),
    }),
    {
      name: 'sigp-prefs', // clé localStorage
      // On persiste tout sauf les fonctions
      partialize: (state) => ({
        theme:   state.theme,
        region:  state.region,
        display: state.display,
        a11y:    state.a11y,
        notifs:  state.notifs,
      }),
    },
  ),
)

// ── Helper : applique la classe dark sur <html> ────────────────
export function applyThemeClass(theme: Theme) {
  const root = document.documentElement
  if (theme === 'dark') {
    root.classList.add('dark')
  } else if (theme === 'light') {
    root.classList.remove('dark')
  } else {
    // 'auto' — suit la préférence système
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    if (prefersDark) root.classList.add('dark')
    else root.classList.remove('dark')
  }
}
