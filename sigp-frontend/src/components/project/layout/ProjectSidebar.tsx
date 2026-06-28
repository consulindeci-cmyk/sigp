import { cn } from '@/lib/utils';

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
        { id: "overview", label: "Informations Générales", status: "success", meta: "+5%" },
        { id: "governance", label: "Gouvernance", status: "warning", meta: "3 acteurs" },
        { id: "logframe", label: "Cadre Logique", status: "destructive", meta: "0 obj." },
        { id: "wbs", label: "Structure (WBS)", status: "warning", meta: "4 comp." }
      ]
    },
    {
      title: "Planification & Opérations",
      weight: "20%",
      items: [
        { id: "ptba", label: "PTBA", status: "destructive", meta: "0 tâches" },
        { id: "activities", label: "Activités", status: "destructive", meta: "0/0" },
        { id: "journal", label: "Journal des Opérations", status: "warning", meta: "2 entrées" }
      ]
    },
    {
      title: "Budget & Finances",
      weight: "20%",
      items: [
        { id: "budget", label: "Budget", status: "success", meta: "Défini" },
        { id: "funding", label: "Sources de financement", status: "success", meta: "100%" },
        { id: "ppm", label: "Plan de Passation (PPM)", status: "warning", meta: "Planification" },
        { id: "contracts", label: "Gestion des Contrats", status: "warning", meta: "En cours" },
        { id: "disbursements", label: "Décaissements", status: "warning", meta: "68.7%" }
      ]
    },
    {
      title: "Suivi & Contrôle",
      weight: "20%",
      items: [
        { id: "evm", label: "Indicateurs EVM", status: "warning", meta: "SPI 0.79" },
        { id: "risks", label: "Risques & Alertes", status: "destructive", meta: "3 critiques" },
        { id: "deliverables", label: "Livrables", status: "destructive", meta: "0 val." }
      ]
    },
    {
      title: "Documentation & Annexes",
      weight: "10%",
      items: [
        { id: "pdocuments", label: "Documents", status: "warning", meta: "4 fiches" },
        { id: "reports", label: "Rapports", status: "destructive", meta: "0 rap." },
        { id: "history", label: "Historique & Logs", status: "success", meta: "À jour" },
        { id: "comments", label: "Commentaires", status: "success", meta: "2 com." },
        { id: "settings", label: "Paramètres Projet", status: "success", meta: "" }
      ]
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'bg-success';
      case 'warning': return 'bg-warning';
      case 'destructive': return 'bg-destructive';
      default: return 'bg-muted';
    }
  };

  return (
    <div className="w-full lg:w-72 shrink-0 lg:border-r border-border bg-background flex flex-col h-full lg:h-[calc(100vh-4rem)] lg:sticky lg:top-16">
      <div className="flex-1 overflow-y-auto overflow-x-auto lg:overflow-x-hidden scrollbar-thin p-4">
        <div className="flex lg:flex-col gap-6 lg:gap-8 min-w-max lg:min-w-0">
          {menuGroups.map((group, gIdx) => (
            <div key={gIdx} className="flex flex-col gap-2">
              <div className="flex items-center justify-between px-3 mb-1">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  {group.title}
                </span>
                <span className="text-[10px] font-semibold text-muted-foreground/70 hidden lg:inline">
                  {group.weight}
                </span>
              </div>
              
              <div className="flex lg:flex-col gap-2 lg:gap-1">
                {group.items.map((item) => {
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      className={cn(
                        "flex items-center justify-between px-3 py-2.5 rounded-md lg:rounded-none lg:border-r-4 transition-colors text-left shrink-0 w-full overflow-hidden",
                        isActive
                          ? "bg-accent/10 border-accent text-foreground font-semibold"
                          : "border-transparent text-muted-foreground hover:bg-muted/50 hover:text-foreground font-medium"
                      )}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={cn("h-2 w-2 rounded-full shrink-0", getStatusColor(item.status))} />
                        <span className="text-sm truncate">
                          {item.label}
                        </span>
                      </div>
                      <span className="text-[11px] text-muted-foreground hidden lg:inline ml-2 shrink-0">
                        {item.meta}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
