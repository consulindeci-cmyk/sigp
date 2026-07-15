import { createClient } from 'npm:@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;

/**
 * Client scopé au JWT de l'appelant (pas service_role) — chaque requête est
 * filtrée automatiquement par les policies RLS déjà en place sur chaque
 * table, au lieu de recopier à la main la logique d'org-scoping. Réservé aux
 * Edge Functions de lecture seule (dashboard-summary, project-detail-summary).
 */
export function buildUserScopedClient(req: Request) {
  const authHeader = req.headers.get('Authorization')!;
  return createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });
}
