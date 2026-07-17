import { corsHeaders, json } from '../_shared/cors.ts';
import { authorize, requireRole } from '../_shared/authorize.ts';
import { buildUserScopedClient } from '../_shared/user-scoped-client.ts';

// ─────────────────────────────────────────────────────────────────────────────
// Dashboard Super Admin — vue macro plateforme (toutes organisations
// confondues). Réservé SUPER_ADMIN (requireRole strict, contrairement à
// dashboard-summary qui autorise tous les rôles).
//
// Même déviation architecturale que dashboard-summary : client scopé au JWT
// de l'appelant plutôt que service_role — is_admin() (= SUPER_ADMIN) bypass
// déjà RLS sur organisations/users/projects/historique, donc chaque requête
// renvoie naturellement la vue plateforme complète sans recopier de logique
// d'agrégation inter-organisations à la main.
// ─────────────────────────────────────────────────────────────────────────────

interface HistoriqueRow {
  id: string;
  user_id: string | null;
  action: string;
  table_cible: string;
  enregistrement_id: string | null;
  apres: Record<string, unknown> | null;
  avant: Record<string, unknown> | null;
  created_at: string;
  user: { nom: string; prenom: string; role: string } | { nom: string; prenom: string; role: string }[] | null;
}

const ELEMENT_FIELD_CANDIDATES = ['code', 'nom', 'libelle', 'titre', 'intitule', 'numero'];

function deriveElement(row: HistoriqueRow): string {
  const snapshot = row.apres ?? row.avant;
  if (snapshot) {
    for (const field of ELEMENT_FIELD_CANDIDATES) {
      const val = snapshot[field];
      if (typeof val === 'string' && val.trim()) return val;
    }
  }
  const shortId = row.enregistrement_id ? row.enregistrement_id.slice(0, 8) : '—';
  return `${row.table_cible}#${shortId}`;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Méthode non autorisée' }, 405);

  try {
    const { profile } = await authorize(req);
    requireRole(profile, ['SUPER_ADMIN']);

    const db = buildUserScopedClient(req);

    const [organisationsRows, usersCount, projectsRows, historiqueRows] = await Promise.all([
      db.from('organisations').select('statut'),
      db.from('users').select('*', { count: 'exact', head: true }).is('deleted_at', null),
      db.from('projects').select('budget_total, statut').is('deleted_at', null),
      db
        .from('historique')
        .select('id, user_id, action, table_cible, enregistrement_id, apres, avant, created_at, user:users(nom, prenom, role)')
        .order('created_at', { ascending: false })
        .limit(20),
    ]);

    if (organisationsRows.error) throw organisationsRows.error;
    if (usersCount.error) throw usersCount.error;
    if (projectsRows.error) throw projectsRows.error;
    if (historiqueRows.error) throw historiqueRows.error;

    // ── KPI macro ────────────────────────────────────────────────────────────
    let organisationsActives = 0;
    let organisationsSuspendues = 0;
    for (const o of organisationsRows.data ?? []) {
      if (o.statut === 'SUSPENDUE') organisationsSuspendues++;
      else organisationsActives++;
    }

    let budgetTotal = 0;
    let budgetActif = 0;
    for (const p of projectsRows.data ?? []) {
      const montant = Number(p.budget_total ?? 0);
      budgetTotal += montant;
      if (p.statut === 'EN_COURS') budgetActif += montant;
    }
    const pctBudgetActif = budgetTotal > 0 ? Math.round((budgetActif / budgetTotal) * 100) : 0;

    // ── Flux d'audit global (20 dernières opérations, toutes confondues) ────
    const operationsRecentes = (historiqueRows.data as unknown as HistoriqueRow[]).map((row) => {
      const user = Array.isArray(row.user) ? row.user[0] : row.user;
      return {
        id: row.id,
        action: row.action,
        tableCible: row.table_cible,
        element: deriveElement(row),
        auteurNom: user ? `${user.prenom} ${user.nom}`.trim() : 'Système',
        auteurRole: user?.role ?? null,
        createdAt: row.created_at,
      };
    });

    return json({
      organisations: {
        total: (organisationsRows.data ?? []).length,
        actives: organisationsActives,
        suspendues: organisationsSuspendues,
      },
      utilisateursTotal: usersCount.count ?? 0,
      finances: {
        budgetTotal,
        budgetActif,
        pctBudgetActif,
      },
      operationsRecentes,
      generatedAt: new Date().toISOString(),
    });
  } catch (err) {
    const status = (err as { status?: number }).status ?? 500;
    console.error('[super-admin-dashboard-summary]', err);
    return json({ error: (err as Error).message ?? 'Erreur interne' }, status);
  }
});
