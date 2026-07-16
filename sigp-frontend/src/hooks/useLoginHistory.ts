import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabaseClient'

export interface LoginHistoryEntry {
  id: string
  createdAt: string
  navigateur: string
}

// Extrait un libellé lisible (navigateur + OS) d'un user-agent brut — pas de
// dépendance externe, juste les motifs les plus courants.
function parseUserAgent(ua: string | null): string {
  if (!ua) return 'Navigateur inconnu'
  const browser =
    /Edg\//.test(ua) ? 'Edge' :
    /OPR\//.test(ua) ? 'Opera' :
    /Chrome\//.test(ua) ? 'Chrome' :
    /Firefox\//.test(ua) ? 'Firefox' :
    /Safari\//.test(ua) ? 'Safari' : 'Navigateur'
  const os =
    /Windows/.test(ua) ? 'Windows' :
    /Mac OS X/.test(ua) ? 'macOS' :
    /Android/.test(ua) ? 'Android' :
    /iPhone|iPad/.test(ua) ? 'iOS' :
    /Linux/.test(ua) ? 'Linux' : ''
  return os ? `${browser} sur ${os}` : browser
}

export function useLoginHistory(userId: string | undefined) {
  return useQuery({
    queryKey: ['login-history', userId],
    queryFn: async (): Promise<LoginHistoryEntry[]> => {
      const { data, error } = await supabase
        .from('login_history')
        .select('id, created_at, user_agent')
        .eq('user_id', userId as string)
        .order('created_at', { ascending: false })
        .limit(20)
      if (error) throw error
      return (data ?? []).map(row => ({
        id: row.id,
        createdAt: row.created_at,
        navigateur: parseUserAgent(row.user_agent),
      }))
    },
    enabled: !!userId,
  })
}
