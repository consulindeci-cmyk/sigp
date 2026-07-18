import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { invokeEdgeFunction } from '@/lib/supabaseFunctions';

export interface Organisation {
  id:           string;
  nom:          string;
  adresse:      string;
  ville:        string;
  pays:         string;
  telephone:    string;
  email:        string;
  siteWeb:      string;
  deviseDefaut: string;
}

interface OrganisationRow {
  id: string;
  nom: string | null;
  adresse: string | null;
  ville: string | null;
  pays: string | null;
  telephone: string | null;
  email: string | null;
  site_web: string | null;
  devise_defaut: string | null;
}

function adapt(row: OrganisationRow): Organisation {
  return {
    id:           row.id,
    nom:          row.nom ?? '',
    adresse:      row.adresse ?? '',
    ville:        row.ville ?? '',
    pays:         row.pays ?? '',
    telephone:    row.telephone ?? '',
    email:        row.email ?? '',
    siteWeb:      row.site_web ?? '',
    deviseDefaut: row.devise_defaut ?? 'XOF',
  };
}

const organisationKeys = { all: () => ['organisation'] as const };

// RLS (organisations_select) ne laisse voir que l'organisation de l'utilisateur
// courant (is_admin() = SUPER_ADMIN excepté, mais ce hook n'est jamais appelé
// pour ce rôle — cf. SettingsPage.tsx) — pas de filtre explicite nécessaire
// ici, une seule organisation visible par utilisateur dans ce déploiement.
export function useOrganisation() {
  return useQuery({
    queryKey: organisationKeys.all(),
    queryFn: async (): Promise<Organisation | null> => {
      const { data, error } = await supabase
        .from('organisations')
        .select('id, nom, adresse, ville, pays, telephone, email, site_web, devise_defaut')
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data ? adapt(data as OrganisationRow) : null;
    },
  });
}

export interface UpdateOrganisationPayload {
  nom?: string;
  adresse?: string;
  ville?: string;
  pays?: string;
  telephone?: string;
  email?: string;
  siteWeb?: string;
}

export function useUpdateOrganisation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: UpdateOrganisationPayload) => {
      const { data } = await invokeEdgeFunction<{ data: OrganisationRow }>('organisations-update', { ...payload });
      return adapt(data);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: organisationKeys.all() }),
    onError:   () => qc.invalidateQueries({ queryKey: organisationKeys.all() }),
  });
}
