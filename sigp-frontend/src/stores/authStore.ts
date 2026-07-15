import { create } from 'zustand'
import type { User, Role } from '@/types'
import { supabase } from '@/lib/supabaseClient'

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isAuthChecked: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  checkAuth: () => Promise<void>
}

// Reconstruit le User applicatif depuis le profil public.users lié à la
// session Supabase Auth courante (RLS autorise toujours la lecture de sa
// propre ligne — cf. policy users_select).
async function userFromSupabaseSession(): Promise<User | null> {
  const { data } = await supabase.auth.getSession()
  const authUserId = data.session?.user?.id
  if (!authUserId) return null

  const { data: profile } = await supabase
    .from('users')
    .select('id, nom, prenom, email, role, actif, telephone')
    .eq('auth_user_id', authUserId)
    .maybeSingle()
  if (!profile) return null

  return {
    id: profile.id,
    email: profile.email,
    prenom: profile.prenom,
    nom: profile.nom,
    telephone: profile.telephone ?? undefined,
    role: profile.role as Role,
    actif: profile.actif,
    createdAt: new Date().toISOString(),
  }
}

export const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  isAuthenticated: false,
  isAuthChecked: false,

  login: async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    const user = await userFromSupabaseSession()
    set({ user, isAuthenticated: true, isAuthChecked: true })
  },

  logout: async () => {
    await supabase.auth.signOut()
    set({ user: null, isAuthenticated: false, isAuthChecked: true })
  },

  checkAuth: async () => {
    const user = await userFromSupabaseSession()
    set({ user, isAuthenticated: !!user, isAuthChecked: true })
  },
}))

// Synchronise le store en direct sur les événements Supabase Auth (expiration,
// déconnexion déclenchée depuis un autre onglet, etc.) sans attendre un appel
// manuel à checkAuth().
supabase.auth.onAuthStateChange((_event, session) => {
  if (!session) {
    useAuthStore.setState({ user: null, isAuthenticated: false, isAuthChecked: true })
  }
})
