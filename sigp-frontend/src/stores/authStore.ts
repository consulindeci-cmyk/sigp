import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { User, Role } from '@/types'
import api from '@/lib/axios'

interface AuthState {
  user: User | null
  token: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  isAuthChecked: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  checkAuth: () => Promise<void>
  setTokens: (token: string, refreshToken: string) => void
}

function decodeJwtPayload(token: string): Record<string, unknown> {
  try {
    const payload = token.split('.')[1]
    return JSON.parse(atob(payload))
  } catch {
    return {}
  }
}

function userFromToken(token: string, email: string): User {
  const payload = decodeJwtPayload(token)
  const emailLocal = (payload.email as string | undefined) ?? email
  const namePart = emailLocal.split('@')[0]
  return {
    id: (payload.sub as string) ?? '',
    email: emailLocal,
    prenom: namePart.charAt(0).toUpperCase() + namePart.slice(1),
    nom: '',
    role: ((payload.role as string | undefined) ?? 'OBSERVATEUR') as Role,
    actif: true,
    createdAt: new Date().toISOString(),
  }
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      isAuthChecked: false,

      setTokens: (token, refreshToken) => set({ token, refreshToken }),

      login: async (email, password) => {
        const response = await api.post('/auth/login', { email, password })
        const { accessToken, refreshToken } = response.data.data
        const user = userFromToken(accessToken, email)
        set({
          user,
          token: accessToken,
          refreshToken,
          isAuthenticated: true,
          isAuthChecked: true,
        })
      },

      logout: async () => {
        const currentRefreshToken = get().refreshToken
        try {
          await api.post('/auth/logout', { refreshToken: currentRefreshToken })
        } catch {
          // Ignore logout errors — clear session regardless
        }
        set({ user: null, token: null, refreshToken: null, isAuthenticated: false, isAuthChecked: true })
      },

      checkAuth: async () => {
        const token = get().token
        if (!token) {
          set({ user: null, token: null, refreshToken: null, isAuthenticated: false, isAuthChecked: true })
          return
        }
        try {
          const payload = decodeJwtPayload(token)
          const exp = payload.exp as number | undefined
          const now = Math.floor(Date.now() / 1000)
          if (exp && exp < now) throw new Error('Token expired')
          // Token valid — keep existing user, just confirm authenticated
          const existingUser = get().user
          const user = existingUser ?? userFromToken(token, (payload.email as string) ?? '')
          set({ user, isAuthenticated: true, isAuthChecked: true })
        } catch {
          set({ user: null, token: null, refreshToken: null, isAuthenticated: false, isAuthChecked: true })
        }
      },
    }),
    {
      name: 'sigp-auth',
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
)
