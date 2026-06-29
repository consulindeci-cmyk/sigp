import { cn } from '@/lib/utils';

interface NavItem {
  id: string;
  label: string;
  status: 'success' | 'warning' | 'destructive' | 'default';
  meta: string;
}

interface NavGroup {
  title: string;
  weight: string;
  items: NavItem[];
}

interface ProjectNavigationProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const NAV_GROUPS: NavGroup[] = [
  {
    title: "Aperçu & Cadrage",
    weight: "30%",
    items: [
      { id: "overview",    label: "Informations Générales", status: "success",     meta: "+5%"          },
      { id: "governance",  label: "Gouvernance",             status: "warning",     meta: "3 acteurs"    },
      { id: "logframe",    label: "Cadre Logique",           status: "destructive", meta: "0 obj."       },
      { id: "wbs",         label: "Structure (WBS)",         status: "warning",     meta: "4 comp."      },
    ],
  },
  {
    title: "Planification & Opérations",
    weight: "20%",
    items: [
      { id: "ptba",        label: "PTBA",                    status: "destructive", meta: "0 tâches"     },
      { id: "activities",  label: "Activités",               status: "destructive", meta: "0/0"          },
      { id: "journal",     label: "Journal des Opérations",  status: "warning",     meta: "2 entrées"    },
    ],
  },
  {
    title: "Budget & Finances",
    weight: "20%",
    items: [
      { id: "budget",        label: "Budget",                    status: "success",     meta: "Défini"        },
      { id: "funding",       label: "Sources de financement",    status: "success",     meta: "100%"          },
      { id: "ppm",           label: "Plan de Passation (PPM)",   status: "warning",     meta: "Planification" },
      { id: "contracts",     label: "Gestion des Contrats",      status: "warning",     meta: "En cours"      },
      { id: "disbursements", label: "Décaissements",             status: "warning",     meta: "68.7%"         },
    ],
  },
  {
    title: "Suivi & Contrôle",
    weight: "20%",
    items: [
      { id: "evm",          label: "Indicateurs EVM",     status: "warning",     meta: "SPI 0.79"    },
      { id: "risks",        label: "Risques & Alertes",   status: "destructive", meta: "3 critiques" },
      { id: "deliverables", label: "Livrables",           status: "destructive", meta: "0 val."      },
    ],
  },
  {
    title: "Documentation & Annexes",
    weight: "10%",
    items: [
      { id: "pdocuments", label: "Documents",          status: "warning",  meta: "4 fiches" },
      { id: "reports",    label: "Rapports",           status: "destructive", meta: "0 rap." },
      { id: "history",    label: "Historique & Logs",  status: "success",  meta: "À jour"   },
      { id: "comments",   label: "Commentaires",       status: "success",  meta: "2 com."   },
      { id: "settings",   label: "Paramètres Projet",  status: "success",  meta: ""         },
    ],
  },
];

function getStatusColor(status: string) {
  switch (status) {
    case 'success':     return 'bg-success';
    case 'warning':     return 'bg-warning';
    case 'destructive': return 'bg-destructive';
    default:            return 'bg-muted-foreground';
  }
}

export default function ProjectNavigation({ activeTab, setActiveTab }: ProjectNavigationProps) {
  return (
    <div className="w-full bg-background border border-border rounded-lg shadow-sm overflow-hidden">
      <div className="overflow-x-auto scrollbar-thin">
        <div className="flex divide-x divide-border min-w-max">

          {NAV_GROUPS.map((group) => (
            <div key={group.title} className="flex flex-col p-3 min-w-[160px] max-w-[210px]">

              {/* Group header */}
              <div className="flex items-center justify-between mb-2 px-1">
                <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/70 leading-none">
                  {group.title}
                </span>
                <span className="text-[9px] font-semibold text-muted-foreground/50 leading-none">
                  {group.weight}
                </span>
              </div>

              {/* Items */}
              <div className="flex flex-col gap-0.5">
                {group.items.map((item) => {
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      className={cn(
                        "flex items-center justify-between px-2 py-1.5 rounded-md w-full text-left transition-colors group",
                        isActive
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                      )}
                    >
                      <div className="flex items-center gap-1.5 min-w-0">
                        <div className={cn(
                          "h-1.5 w-1.5 rounded-full shrink-0",
                          getStatusColor(item.status)
                        )} />
                        <span className={cn(
                          "text-[11px] truncate",
                          isActive ? "font-semibold" : "font-medium"
                        )}>
                          {item.label}
                        </span>
                      </div>
                      {item.meta && (
                        <span className={cn(
                          "text-[10px] shrink-0 ml-2",
                          isActive ? "text-primary/70 font-medium" : "text-muted-foreground/60"
                        )}>
                          {item.meta}
                        </span>
                      )}
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
