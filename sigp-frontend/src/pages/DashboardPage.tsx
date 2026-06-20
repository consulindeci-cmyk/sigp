import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Legend } from 'recharts'
import { useDashboard } from '@/hooks/useDashboard'
import { useProjects } from '@/hooks/useProjects'
import { formatCurrency } from '@/lib/utils'

const chartData = [
  { month: 'Jan', planifie: 50, engage: 40, decaisse: 20 },
  { month: 'Fév', planifie: 110, engage: 90, decaisse: 50 },
  { month: 'Mar', planifie: 180, engage: 150, decaisse: 90 },
  { month: 'Avr', planifie: 250, engage: 220, decaisse: 140 },
  { month: 'Mai', planifie: 320, engage: 300, decaisse: 180 },
  { month: 'Juin', planifie: 390, engage: 340, decaisse: 230 },
]

export default function DashboardPage() {
  const { data: dashboard, isLoading: dashLoading } = useDashboard()
  const { data: projetsData, isLoading: projLoading } = useProjects({ limit: 20 })
  const projets = projetsData?.data ?? []

  // Calcul du budget total avec les vraies données (sinon on garde la démo si c'est 0)
  const totalBudgetBrut = projets.reduce((s, p) => s + parseFloat(String(p.budget_total) || '0'), 0)
  const budgetAffiche = totalBudgetBrut > 0 
    ? (totalBudgetBrut >= 1_000_000 ? `${(totalBudgetBrut / 1_000_000).toFixed(1)}M F` : formatCurrency(String(totalBudgetBrut), 'XOF'))
    : "500 000"

  const risquesEleves = 2 // Mock de la donnée s'il n'y a pas d'endpoint risques direct
  const actifsCount = dashboard?.projets?.actifs ?? projets.filter(p => p.statut === 'ACTIF').length

  return (
    <div className="p-8 max-w-[1400px] mx-auto space-y-8">
      {/* 1. Titre et sous-titre */}
      <div>
        <h2 className="text-3xl font-bold text-[#0A1628]">Dashboard général</h2>
        <p className="text-gray-500 mt-2">Vue stratégique pour directeur de projet, bailleur ou comité de pilotage.</p>
      </div>

      {/* 2. KPIs */}
      {dashLoading || projLoading ? (
        <div className="py-12 flex justify-center text-gray-500">Chargement des données...</div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {/* Budget total */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-200">
            <p className="text-gray-500 text-sm font-semibold mb-3">Budget total</p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-[#2563EB]">{budgetAffiche}</span>
              <span className="text-[10px] font-bold text-[#2563EB] bg-blue-50 px-1.5 py-0.5 rounded-full">+5%</span>
            </div>
          </div>
          {/* Engagé */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-200">
            <p className="text-gray-500 text-sm font-semibold mb-3">Engagé</p>
            <p className="text-2xl font-bold text-[#F97316]">300 000</p>
          </div>
          {/* Décaissé */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-200">
            <p className="text-gray-500 text-sm font-semibold mb-3">Décaissé</p>
            <p className="text-2xl font-bold text-[#0F766E]">180 000</p>
          </div>
          {/* Solde */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-200">
            <p className="text-gray-500 text-sm font-semibold mb-3">Solde</p>
            <p className="text-2xl font-bold text-[#16A34A]">320 000</p>
          </div>
          {/* Avancement */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-200">
            <p className="text-gray-500 text-sm font-semibold mb-3">Projets actifs</p>
            <p className="text-2xl font-bold text-[#2563EB]">{actifsCount}</p>
          </div>
          {/* Risques élevés */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-200">
            <p className="text-gray-500 text-sm font-semibold mb-3">Risques élevés</p>
            <p className="text-2xl font-bold text-[#DC2626]">{risquesEleves}</p>
          </div>
        </div>
      )}

      {/* 3. Graphique et Alertes */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Courbe de suivi financier */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 shadow-sm border border-gray-200">
          <h3 className="text-lg font-bold text-[#0A1628] mb-6">Courbe de suivi financier</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: -20 }}>
                <CartesianGrid vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="month" axisLine={true} tickLine={true} tick={{ fill: '#6B7280', fontSize: 12 }} />
                <YAxis domain={[0, 450]} ticks={[0, 50, 100, 150, 200, 250, 300, 350, 400, 450]} axisLine={true} tickLine={true} tick={{ fill: '#6B7280', fontSize: 12 }} />
                <Legend 
                  verticalAlign="bottom" 
                  height={36} 
                  iconType="circle"
                  wrapperStyle={{ paddingTop: '20px', fontSize: '14px', color: '#4B5563' }}
                />
                <Line type="linear" dataKey="planifie" name="Planifié" stroke="#DC2626" strokeWidth={3} dot={{ r: 4, fill: '#DC2626' }} />
                <Line type="linear" dataKey="engage" name="Engagé" stroke="#2563EB" strokeWidth={3} dot={{ r: 4, fill: '#2563EB' }} />
                <Line type="linear" dataKey="decaisse" name="Décaissé" stroke="#16A34A" strokeWidth={3} dot={{ r: 4, fill: '#16A34A' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Alertes prioritaires */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-6 shadow-sm border border-gray-200 flex flex-col">
          <h3 className="text-lg font-bold text-[#0A1628] mb-6">Alertes prioritaires</h3>
          <div className="space-y-6 flex-1">
            <div className="flex items-center gap-4">
              <span className="bg-[#DC2626] text-white text-[11px] tracking-wide font-bold px-3 py-1.5 rounded w-[75px] text-center">ROUGE</span>
              <span className="text-sm text-gray-700 font-medium">Retard sur construction des forages</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="bg-[#F97316] text-white text-[11px] tracking-wide font-bold px-3 py-1.5 rounded w-[75px] text-center">ORANGE</span>
              <span className="text-sm text-gray-700 font-medium">Consommation carburant &gt; 80%</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="bg-[#16A34A] text-white text-[11px] tracking-wide font-bold px-3 py-1.5 rounded w-[75px] text-center">VERT</span>
              <span className="text-sm text-gray-700 font-medium">Formation des comités terminée</span>
            </div>
          </div>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <span className="text-sm font-semibold text-gray-500">Action rapide</span>
            <button className="bg-[#2563EB] hover:bg-blue-700 text-white font-bold py-2.5 px-6 rounded-lg text-sm transition-colors">
              Générer rapport mensuel
            </button>
          </div>
        </div>
      </div>

      {/* 4. Bande pleine largeur en bas */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 text-center md:text-left">
        <p className="font-bold text-[#0A1628]">
          Décision à prendre : arbitrer le budget des activités en retard et déclencher un suivi hebdomadaire.
        </p>
      </div>
    </div>
  )
}
