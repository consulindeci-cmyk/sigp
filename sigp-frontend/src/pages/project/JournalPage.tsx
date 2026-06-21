import React from 'react';
import { useParams } from 'react-router-dom';
import { useUIStore } from '@/stores/uiStore';
import { useJournal } from '@/hooks/useJournal';
import { useProject } from '@/hooks/useProjects';
import { PageHeader } from '@/components/layout/AppShell';
import { KPICard } from '@/components/shared/KPICard';
import { formatCurrency } from '@/lib/utils';
import { StatusBadge } from '@/components/shared/Badges';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Loader2, ListTodo, Wallet, Coins, Landmark, ShieldCheck } from 'lucide-react';

export default function JournalPage() {
  const { id: urlProjectId } = useParams();
  const { activeProjectId } = useUIStore();
  const resolvedProjectId = urlProjectId || activeProjectId || '';

  const { data: project } = useProject(resolvedProjectId);
  const { data: journalData, isLoading } = useJournal(resolvedProjectId);

  const kpis = journalData?.kpis;
  const operations = journalData?.operations || [];

  return (
    <div className="flex flex-col h-full bg-[#F5F6F8]">
      <PageHeader
        title={`Journal des opérations — ${project?.nom_projet ?? '...'}`}
        subtitle={`${project?.code_projet || ''} · Moteur chronologique : chaque ligne représente une tâche, un engagement ou une dépense.`}
      />

      <div className="flex-1 overflow-x-auto overflow-y-auto w-full p-4 md:p-6 space-y-6">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-sigp-muted" />
          </div>
        ) : (
          <>
            {/* KPIs */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <KPICard
                label="Opérations"
                value={kpis?.operationsCount || 0}
                icon={ListTodo}
                color="blue"
              />
              <KPICard
                label="Prévu Total"
                value={formatCurrency(kpis?.prevuTotal || 0, project?.devise)}
                icon={Wallet}
                color="blue"
              />
              <KPICard
                label="Engagé Total"
                value={formatCurrency(kpis?.engageTotal || 0, project?.devise)}
                icon={Landmark}
                color="yellow"
              />
              <KPICard
                label="Décaissé Total"
                value={formatCurrency(kpis?.decaisseTotal || 0, project?.devise)}
                icon={Coins}
                color="green"
              />
            </div>

            {/* Tableau du Journal */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-[#0A1628] text-white font-semibold">
                    <tr>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3">ID</th>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3">Type</th>
                      <th className="px-4 py-3">Description</th>
                      <th className="px-4 py-3 text-right">Montant</th>
                      <th className="px-4 py-3 text-center">Intégrité</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {operations.length === 0 ? (
                      <tr>
                        <td colSpan={10} className="px-4 py-8 text-center text-gray-500">
                          Aucune opération enregistrée pour le moment.
                        </td>
                      </tr>
                    ) : (
                      operations.map((op: any) => (
                        <tr key={op.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3 font-medium text-[#0A1628]">{op.id_journal}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-gray-600">
                            {format(new Date(op.date), 'dd/MM/yyyy HH:mm', { locale: fr })}
                          </td>
                          <td className="px-4 py-3">
                            <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs font-bold">
                              {op.entite_type}
                            </span>
                          </td>
                          <td className="px-4 py-3 max-w-xs truncate" title={op.description}>
                            {op.description}
                          </td>
                          <td className="px-4 py-3 text-right font-mono text-[#0A1628] font-bold">
                            {formatCurrency(op.decaisse > 0 ? op.decaisse : op.engage, project?.devise)}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex items-center justify-center text-green-600" title={`Hash: ${op.hash}`}>
                              <ShieldCheck size={18} />
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Automatisation Métier Proposée */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 mt-6 flex flex-col gap-2">
              <h3 className="font-bold text-[#0A1628] flex items-center gap-2">
                <ShieldCheck className="text-green-600" size={20} />
                Registre d'audit cryptographique (Ledger)
              </h3>
              <p className="text-sm text-gray-600">
                Ce journal est <strong>immuable</strong>. Chaque ligne est scellée avec un Hash SHA-256 (visible au survol du bouclier). Les modifications et suppressions sont impossibles (Append-Only).
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
