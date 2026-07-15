import { supabase } from '@/lib/supabaseClient'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

/**
 * Appelle une Edge Function via fetch() direct plutôt que
 * supabase.functions.invoke() — ce dernier ne remonte pas systématiquement le
 * corps JSON des réponses d'erreur au client (Response déjà consommée en
 * interne par le SDK), ce qui masque le vrai message derrière le générique
 * "Edge Function returned a non-2xx status code". fetch() direct lit la
 * réponse une seule fois et garantit d'obtenir le message réel.
 */
export async function invokeEdgeFunction<T>(name: string, body: Record<string, unknown>): Promise<T> {
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session) throw new Error('Session expirée — reconnectez-vous.')

  const res = await fetch(`${SUPABASE_URL}/functions/v1/${name}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
      apikey: SUPABASE_ANON_KEY,
    },
    body: JSON.stringify(body),
  })

  const payload = await res.json().catch(() => null)

  if (!res.ok) {
    throw new Error(payload?.error ?? `Erreur ${res.status}`)
  }
  return payload as T
}
