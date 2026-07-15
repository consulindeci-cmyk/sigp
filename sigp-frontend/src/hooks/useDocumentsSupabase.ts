// ─────────────────────────────────────────────────────────────────────────────
// PILOTE — module Documents via Supabase (5e module de la Phase 2).
// Métadonnées + versions/uploads (Supabase Storage, bucket privé "sigp-documents").
// ─────────────────────────────────────────────────────────────────────────────
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabaseClient'
import { invokeEdgeFunction } from '@/lib/supabaseFunctions'

export const documentsSupabaseKeys = {
  all: ['documents-supabase'] as const,
  list: () => [...documentsSupabaseKeys.all, 'list'] as const,
}

export interface DocumentSupabaseRow {
  id: string
  project_id: string
  titre: string
  description: string | null
  statut: string
}

export function useDocumentsSupabase() {
  return useQuery({
    queryKey: documentsSupabaseKeys.list(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('documents_projet')
        .select('id, project_id, titre, description, statut')
        .order('created_at', { ascending: false })
        .limit(100)
      if (error) throw error
      return data as DocumentSupabaseRow[]
    },
  })
}

export function useCreateDocumentSupabase() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: {
      projectId: string; titre: string; description?: string;
      statut?: 'BROUILLON' | 'SOUMIS' | 'VALIDE' | 'REJETE' | 'ARCHIVE';
    }) => invokeEdgeFunction<{ data: unknown }>('documents-create', payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: documentsSupabaseKeys.all }),
  })
}

export function useDeleteDocumentSupabase() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => invokeEdgeFunction<{ message: string }>('documents-delete', { id }),
    onSuccess: () => qc.invalidateQueries({ queryKey: documentsSupabaseKeys.all }),
  })
}

// ── Versions & upload ───────────────────────────────────────────────────────

export interface DocumentVersionSupabaseRow {
  id: string
  numero_version: number
  notes: string | null
  upload_id: string
  uploads: { original_name: string; mime_type: string; size_bytes: number } | null
}

export function useDocumentVersionsSupabase(documentId: string | null) {
  return useQuery({
    queryKey: [...documentsSupabaseKeys.all, 'versions', documentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('document_projet_versions')
        .select('id, numero_version, notes, upload_id, uploads(original_name, mime_type, size_bytes)')
        .eq('document_id', documentId as string)
        .order('numero_version', { ascending: false })
      if (error) throw error
      return data as unknown as DocumentVersionSupabaseRow[]
    },
    enabled: !!documentId,
  })
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      // data:<mime>;base64,<payload> — on ne garde que la partie encodée.
      resolve(result.slice(result.indexOf(',') + 1))
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export function useUploadDocumentVersionSupabase() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: { documentId: string; file: File; notes?: string }) => {
      const fileBase64 = await fileToBase64(payload.file)
      return invokeEdgeFunction<{ data: unknown }>('documents-upload-version', {
        documentId: payload.documentId,
        fileName: payload.file.name,
        mimeType: payload.file.type,
        fileBase64,
        notes: payload.notes,
      })
    },
    onSuccess: (_data, variables) =>
      qc.invalidateQueries({ queryKey: [...documentsSupabaseKeys.all, 'versions', variables.documentId] }),
  })
}

export function useDownloadDocumentVersionSupabase() {
  return useMutation({
    mutationFn: (payload: { documentId: string; versionNumber?: number }) =>
      invokeEdgeFunction<{ data: { url: string; originalName: string } }>('documents-download-version', payload),
  })
}
