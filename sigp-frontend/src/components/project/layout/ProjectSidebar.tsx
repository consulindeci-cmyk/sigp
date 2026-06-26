import React from 'react';

interface ProjectSidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function ProjectSidebar({ activeTab, setActiveTab }: ProjectSidebarProps) {
  
  const menuGroups = [
    {
      title: "Aperçu & Cadrage",
      weight: "30%",
      items: [
        { id: "overview", label: "Informations Générales", status: "green", meta: "+5%" },
        { id: "governance", label: "Gouvernance", status: "orange", meta: "3 acteurs" },
        { id: "logframe", label: "Cadre Logique", status: "red", meta: "0 obj." },
        { id: "wbs", label: "Structure (WBS)", status: "orange", meta: "4 comp." }
      ]
    },
    {
      title: "Planification & Opérations",
      weight: "20%",
      items: [
        { id: "ptba", label: "PTBA", status: "red", meta: "0 tâches" },
        { id: "activities", label: "Activités", status: "red", meta: "0/0" },
        { id: "journal", label: "Journal des Opérations", status: "orange", meta: "2 entrées" }
      ]
    },
    {
      title: "Budget & Finances",
      weight: "20%",
      items: [
        { id: "budget", label: "Budget", status: "green", meta: "Défini" },
        { id: "funding", label: "Sources de financement", status: "green", meta: "100%" },
        { id: "procurement", label: "Engagements & Contrats", status: "orange", meta: "14 contrats" },
        { id: "disbursements", label: "Décaissements", status: "orange", meta: "68.7%" }
      ]
    },
    {
      title: "Suivi & Contrôle",
      weight: "20%",
      items: [
        { id: "evm", label: "Indicateurs EVM", status: "orange", meta: "SPI 0.79" },
        { id: "risks", label: "Risques & Alertes", status: "red", meta: "3 critiques" },
        { id: "deliverables", label: "Livrables", status: "red", meta: "0 val." }
      ]
    },
    {
      title: "Documentation & Annexes",
      weight: "10%",
      items: [
        { id: "pdocuments", label: "Documents", status: "orange", meta: "4 fiches" },
        { id: "reports", label: "Rapports", status: "red", meta: "0 rap." },
        { id: "history", label: "Historique & Logs", status: "green", meta: "À jour" },
        { id: "comments", label: "Commentaires", status: "green", meta: "2 com." },
        { id: "settings", label: "Paramètres Projet", status: "green", meta: "" }
      ]
    }
  ];

  return (
    <div className="panel" style={{ width: '280px', flexShrink: 0, padding: '20px 0' }}>
      {menuGroups.map((group, gIdx) => (
        <div key={gIdx} style={{ marginBottom: '24px' }}>
          <div style={{ padding: '0 20px', marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--slate)' }}>
              {group.title}
            </span>
            <span style={{ fontSize: '10px', fontWeight: 600, color: 'var(--slate-light)' }}>{group.weight}</span>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {group.items.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '10px 20px', border: 'none', background: activeTab === item.id ? 'var(--navy-100)' : 'transparent',
                  cursor: 'pointer', textAlign: 'left', transition: 'background 0.2s',
                  borderRight: activeTab === item.id ? '3px solid var(--navy-700)' : '3px solid transparent'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ 
                    width: '8px', height: '8px', borderRadius: '50%', 
                    backgroundColor: item.status === 'green' ? 'var(--green)' : item.status === 'orange' ? 'var(--amber)' : 'var(--red)'
                  }}></div>
                  <span style={{ fontSize: '13.5px', fontWeight: activeTab === item.id ? 600 : 500, color: activeTab === item.id ? 'var(--navy-900)' : 'var(--ink)' }}>
                    {item.label}
                  </span>
                </div>
                <span style={{ fontSize: '11px', color: 'var(--slate)', fontWeight: 500 }}>{item.meta}</span>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
