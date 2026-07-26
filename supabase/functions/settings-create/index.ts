import { corsHeaders, json } from '../_shared/cors.ts';
import { authorize, requireRole } from '../_shared/authorize.ts';

interface CreateSettingBody {
  projectId: string;
  categorie: string;
  nom: string;
  description?: string;
  valeur?: string;
  valeurDefaut?: string;
  typeValeur?: string;
  requis?: boolean;
  modifiable?: boolean;
  statut?: string;
}

const CATEGORIE_PREFIX: Record<string, string> = {
  'Général': 'GEN', 'Organisation': 'ORG', 'Notifications': 'NOT', 'Validation': 'VAL',
  'Sécurité': 'SEC', 'Affichage': 'AFF', 'Archivage': 'ARC',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Méthode non autorisée' }, 405);

  try {
    const { admin, profile } = await authorize(req);
    requireRole(profile, ['COORDINATEUR', 'CHARGE_PROGRAMME', 'ADMIN', 'SUPER_ADMIN']);

    const body: CreateSettingBody = await req.json();
    if (!body.projectId) return json({ error: 'projectId est obligatoire' }, 400);
    if (!body.categorie) return json({ error: 'categorie est obligatoire' }, 400);
    if (!body.nom?.trim()) return json({ error: 'nom est obligatoire' }, 400);

    if (profile.role !== 'SUPER_ADMIN') {
      const { data: projectOrgId, error: orgError } = await admin.rpc('project_organisation_id', {
        p_project_id: body.projectId,
      });
      if (orgError) throw orgError;
      if (!projectOrgId || projectOrgId !== profile.organisation_id) {
        return json({ error: "Ce projet n'appartient pas à votre organisation" }, 403);
      }
    }

    // Code paramètre généré côté serveur : PREFIX-NNN, séquence par catégorie
    // et par projet — évite toute collision entre créations concurrentes.
    const prefix = CATEGORIE_PREFIX[body.categorie] ?? 'GEN';
    const { data: existing, error: seqError } = await admin
      .from('project_settings')
      .select('code_param')
      .eq('project_id', body.projectId)
      .eq('categorie', body.categorie)
      .like('code_param', `${prefix}-%`);
    if (seqError) throw seqError;

    const maxSeq = (existing ?? []).reduce((m: number, row: { code_param: string }) => {
      const n = parseInt(row.code_param.split('-')[1] ?? '0', 10);
      return isNaN(n) ? m : Math.max(m, n);
    }, 0);
    const codeParam = `${prefix}-${String(maxSeq + 1).padStart(3, '0')}`;

    const { data: setting, error: insertError } = await admin
      .from('project_settings')
      .insert({
        id: crypto.randomUUID(),
        project_id: body.projectId,
        code_param: codeParam,
        categorie: body.categorie,
        nom: body.nom.trim(),
        description: body.description ?? '',
        valeur: body.valeur ?? '',
        valeur_defaut: body.valeurDefaut ?? '',
        type_valeur: body.typeValeur ?? 'TEXTE',
        requis: body.requis ?? false,
        modifiable: body.modifiable ?? true,
        statut: body.statut ?? 'ACTIF',
        modifie_par: profile.id,
        created_by: profile.id,
        updated_at: new Date().toISOString(),
      })
      .select('*, modificateur:users!modifie_par(nom, prenom)')
      .single();

    if (insertError) {
      if (insertError.code === '23505') {
        return json({ error: 'Conflit sur le code du paramètre, veuillez réessayer' }, 409);
      }
      throw insertError;
    }

    try {
      await admin.from('historique').insert({
      id: crypto.randomUUID(),
      project_id: body.projectId,
      user_id: profile.id,
      action: 'CREATE',
      table_cible: 'project_settings',
      enregistrement_id: setting.id,
      apres: setting,
      });
    } catch (historiqueError) {
      console.error('[settings-create] historique', historiqueError);
    }

    return json({ data: setting }, 201);
  } catch (err) {
    const status = (err as { status?: number }).status ?? 500;
    console.error('[settings-create]', err);
    return json({ error: (err as Error).message ?? 'Erreur interne' }, status);
  }
});
