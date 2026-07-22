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
// Ne laisse jamais une erreur réseau/transitoire se propager : un échec ici
// doit résoudre vers "non connecté", jamais bloquer indéfiniment l'appelant
// (cf. ProtectedRoute qui attend cette promesse pour sortir de son spinner).
async function userFromSupabaseSession(): Promise<User | null> {
  try {
    const { data } = await supabase.auth.getSession()
    const authUserId = data.session?.user?.id
    if (!authUserId) return null

    const { data: profile } = await supabase
      .from('users')
      .select('id, nom, prenom, email, role, actif, telephone, poste, bio, organisation_id, deleted_at')
      .eq('auth_user_id', authUserId)
      .maybeSingle()
    if (!profile) return null

    // Compte supprimé/désactivé pendant que la session était déjà ouverte :
    // la ligne reste lisible ici (policy users_select_self_or_admin autorise
    // toujours auth_user_id = auth.uid(), sans filtre deleted_at, précisément
    // pour permettre cette détection) mais l'identité n'est plus valide —
    // révoque la session locale immédiatement plutôt que d'attendre
    // l'expiration naturelle du token (cf. migration RLS deleted_at côté
    // helpers, qui coupe déjà l'accès aux données mais pas la session elle-même).
    if (profile.deleted_at || !profile.actif) {
      await supabase.auth.signOut()
      return null
    }

    return {
      id: profile.id,
      email: profile.email,
      prenom: profile.prenom,
      nom: profile.nom,
      telephone: profile.telephone ?? undefined,
      poste: profile.poste ?? undefined,
      bio: profile.bio ?? undefined,
      role: profile.role as Role,
      actif: profile.actif,
      createdAt: new Date().toISOString(),
      organisationId: profile.organisation_id ?? null,
    }
  } catch {
    return null
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
    if (!user) throw new Error('Profil utilisateur introuvable après authentification.')
    set({ user, isAuthenticated: true, isAuthChecked: true })
    // Best-effort : ne doit jamais bloquer ni faire échouer la connexion.
    supabase.from('login_history').insert({ user_id: user.id, user_agent: navigator.userAgent }).then(() => {})
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
