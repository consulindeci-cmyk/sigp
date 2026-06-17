import { useParams } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { PageHeader } from '@/components/layout/AppShell'
import { useWBS } from '@/hooks/useDashboard'
import { useProject } from '@/hooks/useProjects'

export default function WBSPage() {
  const { id: projectId = '' } = useParams()
  const { data: project } = useProject(projectId)
  const { data: wbsData, isLoading } = useWBS(projectId)

  const wbs = wbsData?.data ?? []

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title={`Work Breakdown Structure (WBS) — ${project?.code_projet ?? '...'}`}
        subtitle="Structure de découpage du projet"
      />

      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="animate-spin text-sigp-muted" /></div>
      ) : (
        <div className="flex-1 overflow-auto w-full p-4 md:p-6 space-y-4 md:space-y-6">
          <div className="bg-navy-800 border border-navy-500 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="excel-table min-w-max">
                <thead>
                  <tr>
                    <th className="w-32">Code WBS</th>
                    <th>Nom de la Phase / Composante</th>
                    <th className="w-24 text-center">Niveau</th>
                  </tr>
                </thead>
                <tbody>
                  {wbs.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="text-center py-8 text-sigp-muted">
                        Aucune structure WBS définie.
                      </td>
                    </tr>
                  ) : (
                    wbs.map((item: any) => (
                      <tr key={item.id}>
                        <td className="font-mono text-sigp-blue font-medium whitespace-nowrap">{item.code_wbs}</td>
                        <td className="font-medium" style={{ paddingLeft: `${(item.niveau - 1) * 1.5 + 0.5}rem` }}>
                          {item.nom_phase}
                        </td>
                        <td className="text-center font-mono">{item.niveau}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
