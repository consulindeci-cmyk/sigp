import { cn } from '@/lib/utils';

interface ProjectSummary {
  nombreActivites?: number;
  activitesTerminees?: number;
  activitesEnRetard?: number;
  nombreLivrables?: number;
  livrablesTermines?: number;
  risquesCritiques?: number;
  nombreContrats?: number;
  contratsActifs?: number;
  tauxDecaissement?: number;
}

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
  summary?: ProjectSummary;
}

function buildGroups(s?: ProjectSummary): NavGroup[] {
  const acts = s?.nombreActivites ?? 0;
  const actsOk = s?.activitesTerminees ?? 0;
  const actsLate = s?.activitesEnRetard ?? 0;
  const livs = s?.nombreLivrables ?? 0;
  const livsOk = s?.livrablesTermines ?? 0;
  const risks = s?.risquesCritiques ?? 0;
  const contracts = s?.contratsActifs ?? 0;
  const taux = s?.tauxDecaissement ?? 0;

  return [
    {
      title: "Aperçu & Cadrage",
      weight: "30%",
      items: [
        { id: "overview",    label: "Informations Générales", status: "success",                                     meta: ""              },
        { id: "governance",  label: "Gouvernance",             status: "warning",                                     meta: ""              },
        { id: "logframe",    label: "Cadre Logique",           status: "default",                                     meta: ""              },
        { id: "wbs",         label: "Structure (WBS)",         status: "default",                                     meta: ""              },
      ],
    },
    {
      title: "Planification & Opérations",
      weight: "20%",
      items: [
        {
          id: "ptba",
          label: "PTBA",
          status: acts === 0 ? "default" : actsLate > 0 ? "destructive" : "success",
          meta: acts > 0 ? `${actsOk}/${acts}` : "0 tâches",
        },
        {
          id: "activities",
          label: "Activités",
          status: acts === 0 ? "default" : actsLate > 0 ? "destructive" : "warning",
          meta: actsLate > 0 ? `${actsLate} retard` : `${actsOk}/${acts}`,
        },
        { id: "journal",     label: "Journal des Opérations",  status: "warning",  meta: ""              },
      ],
    },
    {
      title: "Budget & Finances",
      weight: "20%",
      items: [
        { id: "budget",        label: "Budget",                    status: "success",                                         meta: taux > 0 ? `${taux.toFixed(0)}%` : "" },
        { id: "funding",       label: "Sources de financement",    status: "success",                                         meta: ""              },
        { id: "ppm",           label: "Plan de Passation (PPM)",   status: "warning",                                         meta: ""              },
        {
          id: "contracts",
          label: "Gestion des Contrats",
          status: contracts > 0 ? "success" : "default",
          meta: contracts > 0 ? `${contracts} actif${contracts > 1 ? 's' : ''}` : "",
        },
        {
          id: "disbursements",
          label: "Décaissements",
          status: taux >= 60 ? "success" : taux > 0 ? "warning" : "default",
          meta: taux > 0 ? `${taux.toFixed(1)}%` : "",
        },
      ],
    },
    {
      title: "Suivi & Contrôle",
      weight: "20%",
      items: [
        { id: "evm",          label: "Indicateurs EVM",     status: "warning",                                                   meta: ""                                 },
        {
          id: "risks",
          label: "Risques & Alertes",
          status: risks > 0 ? "destructive" : "success",
          meta: risks > 0 ? `${risks} crit.` : "OK",
        },
        {
          id: "deliverables",
          label: "Livrables",
          status: livs === 0 ? "default" : livsOk === livs ? "success" : livsOk > 0 ? "warning" : "destructive",
          meta: livs > 0 ? `${livsOk}/${livs} val.` : "0 val.",
        },
      ],
    },
    {
      title: "Documentation & Annexes",
      weight: "10%",
      items: [
        { id: "pdocuments", label: "Documents",          status: "warning",     meta: "" },
        { id: "reports",    label: "Rapports",           status: "destructive", meta: "" },
        { id: "history",    label: "Historique & Logs",  status: "success",     meta: "" },
        { id: "comments",   label: "Commentaires",       status: "success",     meta: "" },
        { id: "settings",   label: "Paramètres Projet",  status: "success",     meta: "" },
      ],
    },
  ];
}

function getStatusColor(status: string) {
  switch (status) {
    case 'success':     return 'bg-success';
    case 'warning':     return 'bg-warning';
    case 'destructive': return 'bg-destructive';
    default:            return 'bg-muted-foreground';
  }
}

export default function ProjectNavigation({ activeTab, setActiveTab, summary }: ProjectNavigationProps) {
  const groups = buildGroups(summary);

  return (
    <div className="w-full bg-background border border-border rounded-lg shadow-sm overflow-hidden">
      <div className="overflow-x-auto scrollbar-thin">
        <div className="flex divide-x divide-border min-w-max">

          {groups.map((group) => (
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
