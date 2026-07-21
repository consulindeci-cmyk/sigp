import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabaseClient'
import { invokeEdgeFunction } from '@/lib/supabaseFunctions'
import type { ConfigurationProjet, CategorieParametre, StatutParametre } from '@/types'

interface SettingRow {
  id: string; project_id: string; code_param: string; categorie: string
  nom: string; description: string; valeur: string; valeur_defaut: string
  type_valeur: string; requis: boolean; modifiable: boolean; statut: string
  modifie_par: string | null; created_at: string; updated_at: string
  modificateur: { nom: string; prenom: string } | { nom: string; prenom: string }[] | null
}

const SETTING_SELECT = `
  id, project_id, code_param, categorie, nom, description, valeur, valeur_defaut,
  type_valeur, requis, modifiable, statut, modifie_par, created_at, updated_at,
  modificateur:users!modifie_par(nom, prenom)
`

function adaptSetting(row: SettingRow): ConfigurationProjet {
  const modif = Array.isArray(row.modificateur) ? row.modificateur[0] : row.modificateur
  return {
    id: row.id,
    projet_id: row.project_id,
    code_param: row.code_param,
    categorie: row.categorie as CategorieParametre,
    nom: row.nom,
    description: row.description,
    valeur: row.valeur,
    valeur_defaut: row.valeur_defaut,
    type_valeur: row.type_valeur as ConfigurationProjet['type_valeur'],
    requis: row.requis,
    modifiable: row.modifiable,
    statut: row.statut as StatutParametre,
    date_modification: row.updated_at.slice(0, 10),
    modifie_par: modif ? `${modif.prenom} ${modif.nom}` : '—',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function useProjectSettings(projectId: string) {
  return useQuery({
    queryKey: ['project-settings', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('project_settings')
        .select(SETTING_SELECT)
        .eq('project_id', projectId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(500)
      if (error) throw error
      return (data as unknown as SettingRow[]).map(adaptSetting)
    },
    enabled: !!projectId,
  })
}

export interface CreateSettingDto {
  categorie: CategorieParametre; nom: string; description?: string; valeur?: string
  valeurDefaut?: string; typeValeur?: ConfigurationProjet['type_valeur']
  requis?: boolean; modifiable?: boolean; statut?: StatutParametre
}

export function useCreateProjectSetting(projectId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (dto: CreateSettingDto) => {
      const { data } = await invokeEdgeFunction<{ data: SettingRow }>('settings-create', {
        projectId,
        categorie: dto.categorie,
        nom: dto.nom,
        description: dto.description,
        valeur: dto.valeur,
        valeurDefaut: dto.valeurDefaut,
        typeValeur: dto.typeValeur,
        requis: dto.requis,
        modifiable: dto.modifiable,
        statut: dto.statut,
      })
      return adaptSetting(data)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['project-settings', projectId] }),
    onError: () => qc.invalidateQueries({ queryKey: ['project-settings', projectId] }),
  })
}

export interface UpdateSettingDto {
  id: string; nom?: string; description?: string; valeur?: string; valeurDefaut?: string
  typeValeur?: ConfigurationProjet['type_valeur']; requis?: boolean; modifiable?: boolean
  statut?: StatutParametre
}

export function useUpdateProjectSetting(projectId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (dto: UpdateSettingDto) => {
      const { data } = await invokeEdgeFunction<{ data: SettingRow }>('settings-update', {
        id: dto.id,
        nom: dto.nom,
        description: dto.description,
        valeur: dto.valeur,
        valeurDefaut: dto.valeurDefaut,
        typeValeur: dto.typeValeur,
        requis: dto.requis,
        modifiable: dto.modifiable,
        statut: dto.statut,
      })
      return adaptSetting(data)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['project-settings', projectId] }),
    onError: () => qc.invalidateQueries({ queryKey: ['project-settings', projectId] }),
  })
}

export function useDeleteProjectSetting(projectId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      await invokeEdgeFunction<{ message: string }>('settings-delete', { id })
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['project-settings', projectId] }),
    onError: () => qc.invalidateQueries({ queryKey: ['project-settings', projectId] }),
  })
}
