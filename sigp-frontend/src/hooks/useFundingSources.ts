import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabaseClient'
import { invokeEdgeFunction } from '@/lib/supabaseFunctions'

export type FundingSourceType = 'BAILLEUR' | 'CONTREPARTIE_NATIONALE' | 'AUTRE'

export interface FundingSource {
  id: string
  nom: string
  type: FundingSourceType
  montant: number
  pourcentage: number | null
  devise: string
  dateAccord: string | null
  dateExpiry: string | null
  contact: string | null
  notes: string | null
}

interface FundingSourceRow {
  id: string; project_id: string; nom: string; type: string; montant: number
  pourcentage: number | null; devise: string; date_accord: string | null
  date_expiry: string | null; contact: string | null; notes: string | null
}

const FUNDING_SOURCE_SELECT = `
  id, project_id, nom, type, montant, pourcentage, devise, date_accord,
  date_expiry, contact, notes
`

function adaptFundingSource(row: FundingSourceRow): FundingSource {
  return {
    id: row.id,
    nom: row.nom,
    type: row.type as FundingSourceType,
    montant: Number(row.montant ?? 0),
    pourcentage: row.pourcentage !== null ? Number(row.pourcentage) : null,
    devise: row.devise,
    dateAccord: row.date_accord,
    dateExpiry: row.date_expiry,
    contact: row.contact,
    notes: row.notes,
  }
}

export function useFundingSources(projectId: string) {
  return useQuery({
    queryKey: ['funding-sources', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('funding_sources')
        .select(FUNDING_SOURCE_SELECT)
        .eq('project_id', projectId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(200)
      if (error) throw error
      return (data as unknown as FundingSourceRow[]).map(adaptFundingSource)
    },
    enabled: !!projectId,
  })
}

export function useCreateFundingSource(projectId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (dto: Partial<FundingSource>) => {
      const { data } = await invokeEdgeFunction<{ data: FundingSourceRow }>('funding-sources-create', {
        projectId,
        nom: dto.nom,
        type: dto.type,
        montant: dto.montant,
        pourcentage: dto.pourcentage ?? undefined,
        devise: dto.devise,
        dateAccord: dto.dateAccord || undefined,
        dateExpiry: dto.dateExpiry || undefined,
        contact: dto.contact || undefined,
        notes: dto.notes || undefined,
      })
      return adaptFundingSource(data)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['funding-sources', projectId] }),
  })
}

export function useUpdateFundingSource(projectId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...dto }: Partial<FundingSource> & { id: string }) => {
      const { data } = await invokeEdgeFunction<{ data: FundingSourceRow }>('funding-sources-update', {
        id,
        nom: dto.nom,
        type: dto.type,
        montant: dto.montant,
        pourcentage: dto.pourcentage ?? undefined,
        devise: dto.devise,
        dateAccord: dto.dateAccord || undefined,
        dateExpiry: dto.dateExpiry || undefined,
        contact: dto.contact || undefined,
        notes: dto.notes || undefined,
      })
      return adaptFundingSource(data)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['funding-sources', projectId] }),
  })
}

export function useDeleteFundingSource(projectId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      await invokeEdgeFunction<{ message: string }>('funding-sources-delete', { id })
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['funding-sources', projectId] }),
  })
}
