import { useParams } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { PageHeader } from '@/components/layout/AppShell'
import { useLogframe } from '@/hooks/useDashboard'
import { useProject } from '@/hooks/useProjects'

export default function LogframePage() {
  const { id: projectId = '' } = useParams()
  const { data: project } = useProject(projectId)
  const { data: logframeData, isLoading } = useLogframe(projectId)

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title={`Cadre Logique — ${project?.code_projet ?? '...'}`}
        subtitle="Suivi des indicateurs de performance"
      />

      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="animate-spin text-sigp-muted" /></div>
      ) : (
        <div className="flex-1 overflow-y-auto p-6">
          <div className="bg-navy-800 border border-navy-500 rounded-lg p-8 text-center text-sigp-muted">
            <h3 className="text-lg font-medium text-sigp-text mb-2">Module Cadre Logique</h3>
            <p>Ce module est en cours de développement.</p>
            <p className="text-xs mt-4 opacity-70">
              Il permettra de suivre la hiérarchie des objectifs (Impact, Effets, Produits) 
              et leurs indicateurs objectivement vérifiables.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
