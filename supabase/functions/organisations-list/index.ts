import { corsHeaders, json } from '../_shared/cors.ts';
import { authorize, requireRole } from '../_shared/authorize.ts';

// Réservé SUPER_ADMIN — vue plateforme sur toutes les organisations.
// Le nombre d'organisations réelles reste modeste (un tenant par client),
// donc pas de pagination/tri/recherche côté serveur : la liste complète est
// renvoyée en un seul appel, le DataTable frontend gère tri/recherche
// côté client (contrairement au module Users, dimensionné pour des milliers
// de lignes).
Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Méthode non autorisée' }, 405);

  try {
    const { admin, profile } = await authorize(req);
    requireRole(profile, ['SUPER_ADMIN']);

    const { data, error } = await admin.rpc('organisation_overview');
    if (error) throw error;

    return json({ data: data ?? [] });
  } catch (err) {
    const status = (err as { status?: number }).status ?? 500;
    console.error('[organisations-list]', err);
    return json({ error: (err as Error).message ?? 'Erreur interne' }, status);
  }
});
