import { corsHeaders, json } from '../_shared/cors.ts';
import { authorize, requireRole } from '../_shared/authorize.ts';

interface CreatePpmEtapeBody {
  marcheId: string;
  libelle: string;
  ordre: number;
  datePrevue?: string;
  dateReelle?: string;
  complete?: boolean;
  notes?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Méthode non autorisée' }, 405);

  try {
    const { admin, profile } = await authorize(req);
    requireRole(profile, ['COORDINATEUR', 'CHARGE_PROGRAMME', 'ADMIN', 'SUPER_ADMIN']);

    const body: CreatePpmEtapeBody = await req.json();
    if (!body.marcheId) return json({ error: 'marcheId est obligatoire' }, 400);
    if (!body.libelle?.trim()) return json({ error: 'libelle est obligatoire' }, 400);
    if (body.ordre === undefined || body.ordre === null) {
      return json({ error: 'ordre est obligatoire' }, 400);
    }

    const { data: marche, error: marcheError } = await admin
      .from('ppm_marches')
      .select('id, project_id')
      .eq('id', body.marcheId)
      .is('deleted_at', null)
      .maybeSingle();
    if (marcheError) throw marcheError;
    if (!marche) return json({ error: 'Marché PPM introuvable' }, 404);

    if (profile.role !== 'SUPER_ADMIN') {
      const { data: projectOrgId, error: orgError } = await admin.rpc('project_organisation_id', {
        p_project_id: marche.project_id,
      });
      if (orgError) throw orgError;
      if (!projectOrgId || projectOrgId !== profile.organisation_id) {
        return json({ error: "Ce marché n'appartient pas à votre organisation" }, 403);
      }
    }

    // ppm_etapes n'a ni created_by/updated_by ni deleted_at — contrairement
    // à toutes les autres tables migrées jusqu'ici.
    const { data: etape, error: insertError } = await admin
      .from('ppm_etapes')
      .insert({
        id: crypto.randomUUID(),
        marche_id: body.marcheId,
        libelle: body.libelle.trim(),
        ordre: body.ordre,
        date_prevue: body.datePrevue ?? null,
        date_reelle: body.dateReelle ?? null,
        complete: body.complete ?? false,
        notes: body.notes ?? null,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      if (insertError.code === '23505') {
        return json({ error: "Conflit de données sur l'étape PPM" }, 409);
      }
      throw insertError;
    }

    try {
      await admin.from('historique').insert({
      id: crypto.randomUUID(),
      project_id: marche.project_id,
      user_id: profile.id,
      action: 'CREATE',
      table_cible: 'ppm_etapes',
      enregistrement_id: etape.id,
      apres: etape,
      });
    } catch (historiqueError) {
      console.error('[ppm-etapes-create] historique', historiqueError);
    }

    return json({ data: etape }, 201);
  } catch (err) {
    const status = (err as { status?: number }).status ?? 500;
    console.error('[ppm-etapes-create]', err);
    return json({ error: (err as Error).message ?? 'Erreur interne' }, status);
  }
});
