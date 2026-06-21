import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '@/types'
import api from '@/lib/axios'

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  login: (email: string, mot_de_passe: string) => Promise<void>
  logout: () => Promise<void>
  checkAuth: () => Promise<void>
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,

      login: async (email, mot_de_passe) => {
        const { data } = await api.post('/auth/login', { email, mot_de_passe })
        set({
          user: data.user,
          isAuthenticated: true,
        })
      },

      logout: async () => {
        try {
          await api.post('/auth/logout')
        } catch (e) {
          console.error('Logout error', e)
        }
        set({ user: null, isAuthenticated: false })
      },

      checkAuth: async () => {
        try {
          const { data } = await api.get('/auth/me')
          set({ user: data.user, isAuthenticated: true })
        } catch (error) {
          set({ user: null, isAuthenticated: false })
        }
      },
    }),
    {
      name: 'sigp-auth',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
)
