import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip,
  LineChart, Line
} from 'recharts';
import { formatCurrency, formatPercent } from '@/lib/utils';
import { KPICard } from '@/components/shared/KPICard';
import { 
  Wallet, Landmark, Coins, TrendingUp, AlertTriangle, 
  FolderKanban, FolderOpen, CheckCircle2, Loader2, Calendar
} from 'lucide-react';

// TODO: remplacer par les données API du Dashboard
const mockDashboardData = {
  projets: {
    total: 12,
    en_cours: 8,
    termines: 4,
  },
  financier: {
    budget_total_bac: 155000000,
    budget_engage: 85000000,
    budget_decaisse: 45000000,
    solde_disponible: 70000000,
    taux_absorption: 29.03, // decaisse / total * 100
  },
  activites: {
    avancement_global_pct: 42.5,
  },
  risques: {
    eleves: 3,
    critiques: 1,
  },
  // Données pour graphiques
  evolution_decaissements: [
    { mois: 'Jan', decaisse: 5000000 },
    { mois: 'Fév', decaisse: 12000000 },
    { mois: 'Mar', decaisse: 18000000 },
    { mois: 'Avr', decaisse: 28000000 },
    { mois: 'Mai', decaisse: 35000000 },
    { mois: 'Juin', decaisse: 45000000 },
  ],
  repartition_bailleurs: [
    { nom: 'Banque Mondiale', montant: 80000000 },
    { nom: 'BAD', montant: 50000000 },
    { nom: 'État de CI', montant: 25000000 },
  ]
};

export default function DashboardPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [anneeActive, setAnneeActive] = useState('2026');

  // Simulation d'un appel réseau (pour respecter la contrainte d'avoir un état loading)
  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, [anneeActive]);

  if (hasError) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-[#F5F6F8]">
        <AlertTriangle className="w-12 h-12 text-red-500 mb-4" />
        <h2 className="text-xl font-bold text-[#0A1628]">Erreur de chargement</h2>
        <p className="text-gray-500 mt-2">Impossible de récupérer les données du tableau de bord global.</p>
        <button 
          onClick={() => setHasError(false)}
          className="mt-6 px-4 py-2 bg-[#2563EB] text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Réessayer
        </button>
      </div>
    );
  }

  // Vérification d'état vide
  const isEmpty = !mockDashboardData || mockDashboardData.projets.total === 0;

  return (
    <div className="p-4 md:p-8 max-w-[1600px] mx-auto space-y-8 bg-[#F5F6F8] min-h-full">
      {/* 1. En-tête et Filtres */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
        <div>
          <h2 className="text-3xl font-bold text-[#0A1628]">Dashboard de Pilotage Stratégique</h2>
          <p className="text-gray-500 mt-2">Vue consolidée multisite pour Directeurs, Bailleurs et Comité de pilotage.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="bg-gray-100 p-2 rounded-lg flex items-center gap-2 border border-gray-200">
            <Calendar className="w-5 h-5 text-gray-500" />
            <select 
              value={anneeActive}
              onChange={(e) => setAnneeActive(e.target.value)}
              className="bg-transparent border-none outline-none text-[#0A1628] font-semibold text-sm cursor-pointer"
            >
              <option value="2026">Exercice 2026</option>
              <option value="2025">Exercice 2025</option>
              <option value="2024">Exercice 2024</option>
              <option value="tout">Toutes les années</option>
            </select>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="py-24 flex flex-col items-center justify-center text-gray-500">
          <Loader2 className="w-10 h-10 animate-spin text-[#2563EB] mb-4" />
          <p className="text-lg font-medium">Récupération des indicateurs consolidés...</p>
        </div>
      ) : isEmpty ? (
        <div className="py-24 flex flex-col items-center justify-center text-gray-500 bg-white rounded-2xl border border-gray-200 border-dashed">
          <FolderKanban className="w-12 h-12 text-gray-300 mb-4" />
          <p className="text-lg font-medium text-[#0A1628]">Aucun projet enregistré</p>
          <p className="text-sm">Le système ne contient pas encore de données financières ou opérationnelles.</p>
        </div>
      ) : (
        <>
          {/* 2. KPIs d'État des Projets (Ligne 1) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <KPICard
              label="Projets Total"
              value={mockDashboardData.projets.total}
              icon={FolderKanban}
              color="blue"
            />
            <KPICard
              label="Projets en cours"
              value={mockDashboardData.projets.en_cours}
              icon={FolderOpen}
              color="yellow"
            />
            <KPICard
              label="Projets terminés"
              value={mockDashboardData.projets.termines}
              icon={CheckCircle2}
              color="green"
            />
          </div>

          {/* 3. KPIs Financiers et Opérationnels (Ligne 2) */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <KPICard
              label="Budget Total (BAC)"
              value={formatCurrency(mockDashboardData.financier.budget_total_bac, 'XOF')}
              icon={Wallet}
              color="blue"
            />
            <KPICard
              label="Montant Engagé"
              value={formatCurrency(mockDashboardData.financier.budget_engage, 'XOF')}
              icon={Landmark}
              color="yellow"
            />
            <KPICard
              label="Montant Décaissé"
              value={formatCurrency(mockDashboardData.financier.budget_decaisse, 'XOF')}
              icon={Coins}
              color="green"
            />
            <KPICard
              label="Solde Disponible"
              value={formatCurrency(mockDashboardData.financier.solde_disponible, 'XOF')}
              icon={Wallet}
              color="blue"
            />
            <KPICard
              label="Avancement Global"
              value={formatPercent(mockDashboardData.activites.avancement_global_pct)}
              icon={TrendingUp}
              color="green"
            />
            <KPICard
              label="Risques Élevés"
              value={mockDashboardData.risques.eleves}
              icon={AlertTriangle}
              color="red"
            />
          </div>

          {/* 4. Graphiques Restitution */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Graphique d'évolution */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
              <h3 className="text-lg font-bold text-[#0A1628] mb-6">Évolution des Décaissements (Cumulé)</h3>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={mockDashboardData.evolution_decaissements} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                    <XAxis dataKey="mois" tick={{ fill: '#6B7280', fontSize: 12 }} />
                    <YAxis 
                      tickFormatter={(val) => val >= 1000000 ? `${(val / 1000000).toFixed(0)}M` : val} 
                      tick={{ fill: '#6B7280', fontSize: 12 }} 
                    />
                    <Tooltip 
                      formatter={(value: any) => formatCurrency(String(value), 'XOF')} 
                      labelStyle={{ color: '#0A1628', fontWeight: 'bold' }}
                    />
                    <Line type="monotone" dataKey="decaisse" stroke="#0F766E" strokeWidth={3} dot={{ r: 4, fill: '#0F766E' }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Graphique de répartition bailleurs */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
              <h3 className="text-lg font-bold text-[#0A1628] mb-6">Répartition par Bailleur de Fonds</h3>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={mockDashboardData.repartition_bailleurs} layout="vertical" margin={{ top: 20, right: 30, left: 50, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E5E7EB" />
                    <XAxis type="number" 
                      tickFormatter={(val) => val >= 1000000 ? `${(val / 1000000).toFixed(0)}M` : val}
                      tick={{ fill: '#6B7280', fontSize: 12 }} 
                    />
                    <YAxis dataKey="nom" type="category" tick={{ fill: '#0A1628', fontSize: 12, fontWeight: 500 }} width={100} />
                    <Tooltip 
                      formatter={(value: any) => formatCurrency(String(value), 'XOF')} 
                      cursor={{fill: '#F3F4F6'}} 
                    />
                    <Bar dataKey="montant" fill="#2563EB" radius={[0, 4, 4, 0]} barSize={30} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>
        </>
      )}
    </div>
  );
}
