import { useMemo } from 'react';
import { Building2, CheckCircle2, Ban, Users, Wallet, Trophy, History } from 'lucide-react';
import { ContentLayout } from '@/components/layout/ContentLayout';
import { PageHeader } from '@/components/layout/AppShell';
import { StatCard } from '@/components/ui/data-display/StatCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/data-display/Card';
import { Badge } from '@/components/ui/data-display/Badge';
import { useSuperAdminDashboard, actionLabel, formatBudgetMacro } from '@/hooks/useSuperAdminDashboard';
import { useOrganisationsList } from '@/hooks/useOrganisationsAdmin';

function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return "à l'instant";
  if (minutes < 60) return `il y a ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `il y a ${hours} h`;
  const days = Math.floor(hours / 24);
  return `il y a ${days} j`;
}

export default function SuperAdminDashboardPage() {
  const { data: summary, isLoading: isSummaryLoading } = useSuperAdminDashboard();
  const { data: organisations, isLoading: isOrganisationsLoading } = useOrganisationsList();

  const topOrganisations = useMemo(
    () => [...(organisations ?? [])].sort((a, b) => b.budgetTotalActif - a.budgetTotalActif).slice(0, 5),
    [organisations]
  );

  const organisationsTotal = summary?.organisations.total ?? 0;
  const organisationsActives = summary?.organisations.actives ?? 0;
  const organisationsSuspendues = summary?.organisations.suspendues ?? 0;

  return (
    <ContentLayout>
      <PageHeader
        title="Tableau de bord plateforme"
        subtitle="Vue macro sur l'ensemble des organisations, indépendamment de votre propre rattachement"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Organisations"
          value={organisationsTotal}
          icon={<Building2 className="h-4 w-4" aria-hidden="true" />}
          iconVariant="primary"
          description={`${organisationsActives} active(s) / ${organisationsSuspendues} suspendue(s)`}
        />
        <StatCard
          title="Organisations actives"
          value={organisationsActives}
          icon={<CheckCircle2 className="h-4 w-4" aria-hidden="true" />}
          iconVariant="success"
          description="accès opérationnel"
        />
        <StatCard
          title="Organisations suspendues"
          value={organisationsSuspendues}
          icon={<Ban className="h-4 w-4" aria-hidden="true" />}
          iconVariant="destructive"
          description="accès bloqué"
        />
        <StatCard
          title="Utilisateurs plateforme"
          value={summary?.utilisateursTotal ?? 0}
          icon={<Users className="h-4 w-4" aria-hidden="true" />}
          iconVariant="info"
          description="toutes organisations confondues"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <StatCard
          className="lg:col-span-1"
          title="Budget consolidé"
          value={`${formatBudgetMacro(summary?.finances.budgetTotal ?? 0)} FCFA`}
          icon={<Wallet className="h-4 w-4" aria-hidden="true" />}
          iconVariant="warning"
          description={`dont ${summary?.finances.pctBudgetActif ?? 0}% sur projets actifs`}
        />

        {/* Classement des organisations par volume budgétaire actif */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center gap-2 pb-2">
            <Trophy className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Organisations les plus volumineuses
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isOrganisationsLoading ? (
              <p className="text-sm text-muted-foreground">Chargement...</p>
            ) : topOrganisations.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucune organisation.</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {topOrganisations.map((org, idx) => (
                  <li key={org.id} className="flex items-center justify-between gap-3 text-sm">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-xs font-bold text-muted-foreground w-4 shrink-0">{idx + 1}</span>
                      <span className="font-medium text-foreground truncate">{org.nom}</span>
                      <Badge variant={org.statut === 'ACTIVE' ? 'success' : 'destructive'} className="text-[10px] shrink-0">
                        {org.statutLabel}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 shrink-0 text-xs text-muted-foreground">
                      <span>{org.projetsActifsCount} projet(s)</span>
                      <span className="font-mono font-semibold text-foreground">
                        {formatBudgetMacro(org.budgetTotalActif)} FCFA
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Mini-flux des dernières opérations, toutes organisations confondues */}
      <Card>
        <CardHeader className="flex flex-row items-center gap-2 pb-2">
          <History className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Dernières opérations (plateforme)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isSummaryLoading ? (
            <p className="text-sm text-muted-foreground">Chargement...</p>
          ) : (summary?.operationsRecentes.length ?? 0) === 0 ? (
            <p className="text-sm text-muted-foreground">Aucune opération récente.</p>
          ) : (
            <ul className="flex flex-col gap-2.5">
              {summary?.operationsRecentes.map((op) => (
                <li key={op.id} className="flex items-center justify-between gap-3 text-sm border-b border-border/50 pb-2 last:border-0 last:pb-0">
                  <span className="text-foreground truncate">
                    <span className="font-medium">{op.auteurNom}</span>{' '}
                    <span className="text-muted-foreground">{actionLabel(op.action)}</span>{' '}
                    <span className="font-medium">{op.element}</span>
                  </span>
                  <span className="text-xs text-muted-foreground shrink-0">{relativeTime(op.createdAt)}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </ContentLayout>
  );
}
