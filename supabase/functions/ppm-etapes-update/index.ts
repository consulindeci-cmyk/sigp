import { corsHeaders, json } from '../_shared/cors.ts';
import { authorize, requireRole } from '../_shared/authorize.ts';

interface UpdatePpmEtapeBody {
  id: string;
  libelle?: string;
  ordre?: number;
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

    const body: UpdatePpmEtapeBody = await req.json();
    if (!body.id) return json({ error: 'id est obligatoire' }, 400);

    // Pas de deleted_at sur cette table : un simple .eq('id', ...) suffit.
    const { data: existing, error: findError } = await admin
      .from('ppm_etapes')
      .select('*')
      .eq('id', body.id)
      .maybeSingle();
    if (findError) throw findError;
    if (!existing) return json({ error: 'Étape PPM introuvable' }, 404);

    const { data: marche } = await admin
      .from('ppm_marches')
      .select('project_id')
      .eq('id', existing.marche_id)
      .maybeSingle();

    if (profile.role !== 'SUPER_ADMIN') {
      const { data: orgId, error: orgError } = await admin.rpc('ppm_marche_organisation_id', {
        p_marche_id: existing.marche_id,
      });
      if (orgError) throw orgError;
      if (!orgId || orgId !== profile.organisation_id) {
        return json({ error: "Accès refusé : cette étape n'appartient pas à votre organisation" }, 403);
      }
    }

    const updatePayload: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (body.libelle !== undefined) updatePayload.libelle = body.libelle.trim();
    if (body.ordre !== undefined) updatePayload.ordre = body.ordre;
    if (body.datePrevue !== undefined) updatePayload.date_prevue = body.datePrevue;
    if (body.dateReelle !== undefined) updatePayload.date_reelle = body.dateReelle;
    if (body.complete !== undefined) updatePayload.complete = body.complete;
    if (body.notes !== undefined) updatePayload.notes = body.notes;

    const { data: updated, error: updateError } = await admin
      .from('ppm_etapes')
      .update(updatePayload)
      .eq('id', body.id)
      .select()
      .single();

    if (updateError) {
      if (updateError.code === '23505') {
        return json({ error: "Conflit de données sur l'étape PPM" }, 409);
      }
      throw updateError;
    }

    await admin.from('historique').insert({
      id: crypto.randomUUID(),
      project_id: marche?.project_id ?? null,
      user_id: profile.id,
      action: 'UPDATE',
      table_cible: 'ppm_etapes',
      enregistrement_id: body.id,
      avant: existing,
      apres: updated,
    });

    return json({ data: updated });
  } catch (err) {
    const status = (err as { status?: number }).status ?? 500;
    console.error('[ppm-etapes-update]', err);
    return json({ error: (err as Error).message ?? 'Erreur interne' }, status);
  }
});
