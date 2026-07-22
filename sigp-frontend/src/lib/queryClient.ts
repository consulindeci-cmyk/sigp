import { QueryCache, MutationCache, QueryClient } from '@tanstack/react-query'
import { supabase } from './supabaseClient'

// Expulsion immédiate : un 401 renvoyé par une Edge Function signifie que
// l'identité de l'appelant n'est plus valide (session expirée, ou compte
// supprimé/désactivé — cf. authorize.ts, qui renvoie spécifiquement 401 pour
// ces cas, jamais pour un refus de permission classique). signOut() suffit
// à rediriger vers /login : le listener onAuthStateChange dans authStore.ts
// met déjà isAuthenticated à false dès l'événement SIGNED_OUT, et
// ProtectedRoute y est abonné (Navigate réactif, pas besoin d'imports router
// ici).
function revokeSessionOn401(error: unknown) {
  if ((error as { status?: number })?.status === 401) {
    supabase.auth.signOut()
  }
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,      // 5 min
      gcTime: 1000 * 60 * 30,        // 30 min
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
  queryCache: new QueryCache({ onError: revokeSessionOn401 }),
  mutationCache: new MutationCache({ onError: revokeSessionOn401 }),
})
