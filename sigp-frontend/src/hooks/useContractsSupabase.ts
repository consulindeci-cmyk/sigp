// ─────────────────────────────────────────────────────────────────────────────
// PILOTE — module Contrats via Supabase (4e module de la Phase 2).
// Même pattern que les autres hooks *Supabase.ts : isolé, ne touche à rien de
// l'existant (useContracts.ts / NestJS reste intact).
// ─────────────────────────────────────────────────────────────────────────────
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabaseClient'
import { invokeEdgeFunction } from '@/lib/supabaseFunctions'

export const contractsSupabaseKeys = {
  all: ['contracts-supabase'] as const,
  list: () => [...contractsSupabaseKeys.all, 'list'] as const,
}

export interface ContractSupabaseRow {
  id: string
  project_id: string
  numero: string
  intitule: string
  type: string
  statut: string
  titulaire: string
  montant: number
  devise: string
}

export function useContractsSupabase() {
  return useQuery({
    queryKey: contractsSupabaseKeys.list(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contracts')
        .select('id, project_id, numero, intitule, type, statut, titulaire, montant, devise')
        .order('created_at', { ascending: false })
        .limit(100)
      if (error) throw error
      return data as ContractSupabaseRow[]
    },
  })
}

export function useCreateContractSupabase() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: {
      projectId: string; numero: string; intitule: string; titulaire: string; montant: number;
      type?: 'MARCHE' | 'CONVENTION' | 'PROTOCOLE' | 'LETTRE_ACCORD';
      statut?: 'ACTIF' | 'SUSPENDU' | 'CLOTURE' | 'RESILIE';
    }) => invokeEdgeFunction<{ data: unknown }>('contracts-create', payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: contractsSupabaseKeys.all }),
  })
}

export function useDeleteContractSupabase() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => invokeEdgeFunction<{ message: string }>('contracts-delete', { id }),
    onSuccess: () => qc.invalidateQueries({ queryKey: contractsSupabaseKeys.all }),
  })
}
