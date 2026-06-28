import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { User } from '@/types'
import api from '@/lib/axios'

interface AuthState {
  user: User | null
  token: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  isAuthChecked: boolean
  login: (email: string, mot_de_passe: string) => Promise<void>
  logout: () => Promise<void>
  checkAuth: () => Promise<void>
  setTokens: (token: string, refreshToken: string) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      isAuthChecked: false,

      setTokens: (token, refreshToken) => set({ token, refreshToken }),

      login: async (email, mot_de_passe) => {
        const { data } = await api.post('/auth/login', { email, mot_de_passe })
        set({
          user: data.user,
          token: data.access_token,
          refreshToken: data.refresh_token,
          isAuthenticated: true,
          isAuthChecked: true,
        })
      },

      logout: async () => {
        try {
          await api.post('/auth/logout')
        } catch {
          // Ignore logout errors — clear session regardless
        }
        set({ user: null, token: null, refreshToken: null, isAuthenticated: false, isAuthChecked: true })
      },

      checkAuth: async () => {
        try {
          const { data } = await api.get('/auth/me')
          set({ user: data.user, isAuthenticated: true, isAuthChecked: true })
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
