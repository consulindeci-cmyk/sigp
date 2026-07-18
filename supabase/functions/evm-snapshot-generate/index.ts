import { corsHeaders, json } from '../_shared/cors.ts';
import { authorize, requireRole } from '../_shared/authorize.ts';

// Déclenchement manuel / filet de sécurité de generate_evm_snapshots() —
// la planification automatique (pg_cron, cf. migration
// 20260721110000_evm_snapshot_cron_schedule.sql) appelle la même fonction
// SQL directement, sans passer par cette Edge Function. Utile si pg_cron
// n'est pas disponible sur ce projet Supabase, ou pour forcer un instantané
// immédiat (ex. avant un rapport bailleur).
Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Méthode non autorisée' }, 405);

  try {
    const { admin, profile } = await authorize(req);
    requireRole(profile, ['FINANCIER', 'ADMIN', 'SUPER_ADMIN']);

    const { data: count, error } = await admin.rpc('generate_evm_snapshots');
    if (error) throw error;

    return json({ data: { projectsSnapshotted: count ?? 0 } });
  } catch (err) {
    const status = (err as { status?: number }).status ?? 500;
    console.error('[evm-snapshot-generate]', err);
    return json({ error: (err as Error).message ?? 'Erreur interne' }, status);
  }
});
