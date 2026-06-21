import React from 'react'

export default function ReportsPage() {
  return (
    <div className="flex flex-col min-h-full bg-[#F5F6F8] p-6 lg:p-8">
      {/* 1. En-tête de page */}
      <div className="mb-8">
        <h1 className="text-[28px] font-bold text-[#0A1628] leading-tight">
          Rapports & exports
        </h1>
        <p className="text-[#6B7280] mt-1.5 text-sm font-medium">
          Produire les rapports bailleurs, direction et comité de pilotage en PDF / Excel.
        </p>
      </div>

      {/* 2. Grille de 6 cartes cliquables */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
        
        {/* Ligne 1 */}
        <button className="bg-white rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all p-6 flex flex-col text-left border-l-4 border-l-[#2563EB] group">
          <h3 className="font-bold text-[#0A1628] text-lg mb-2 group-hover:text-[#2563EB] transition-colors">Rapport mensuel</h3>
          <p className="text-[#6B7280] text-sm font-medium">Dashboard, PTBA, budget, risques</p>
        </button>
        <button className="bg-white rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all p-6 flex flex-col text-left border-l-4 border-l-[#0F766E] group">
          <h3 className="font-bold text-[#0A1628] text-lg mb-2 group-hover:text-[#0F766E] transition-colors">Rapport financier</h3>
          <p className="text-[#6B7280] text-sm font-medium">Engagements, décaissements, écarts</p>
        </button>
        <button className="bg-white rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all p-6 flex flex-col text-left border-l-4 border-l-[#F97316] group">
          <h3 className="font-bold text-[#0A1628] text-lg mb-2 group-hover:text-[#F97316] transition-colors">Rapport EVM</h3>
          <p className="text-[#6B7280] text-sm font-medium">PV, EV, AC, CPI, SPI, EAC</p>
        </button>
        
        {/* Ligne 2 */}
        <button className="bg-white rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all p-6 flex flex-col text-left border-l-4 border-l-[#16A34A] group">
          <h3 className="font-bold text-[#0A1628] text-lg mb-2 group-hover:text-[#16A34A] transition-colors">Export Excel</h3>
          <p className="text-[#6B7280] text-sm font-medium">Données filtrées par module</p>
        </button>
        <button className="bg-white rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all p-6 flex flex-col text-left border-l-4 border-l-[#0A1628] group">
          <h3 className="font-bold text-[#0A1628] text-lg mb-2 opacity-90 transition-opacity">Fiche projet PDF</h3>
          <p className="text-[#6B7280] text-sm font-medium">Synthèse projet et bailleur</p>
        </button>
        <button className="bg-white rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all p-6 flex flex-col text-left border-l-4 border-l-[#DC2626] group">
          <h3 className="font-bold text-[#0A1628] text-lg mb-2 group-hover:text-[#DC2626] transition-colors">Audit trail</h3>
          <p className="text-[#6B7280] text-sm font-medium">Historique des modifications</p>
        </button>
      </div>

      {/* 3. Bande pleine largeur */}
      <div className="bg-[#EEF2FF] border border-blue-100/50 rounded-2xl p-6 text-center shadow-sm">
        <p className="text-[#2563EB] font-bold text-sm md:text-base">
          Expérience cible : choisir un modèle → filtrer la période → générer PDF / Excel → valider → envoyer au bailleur.
        </p>
      </div>
    </div>
  )
}
