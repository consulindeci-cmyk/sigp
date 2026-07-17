import React from 'react';
import { Building2 } from 'lucide-react';
import { PageHeader } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/forms/Button';

export interface OrganisationsToolbarProps {
  onOpenNew: () => void;
}

export const OrganisationsToolbar = React.memo(function OrganisationsToolbar({ onOpenNew }: OrganisationsToolbarProps) {
  return (
    <PageHeader
      title="Gestion des organisations"
      subtitle="Vue plateforme sur l'ensemble des organisations (tenants), leurs administrateurs et leur activité"
      actions={
        <Button variant="default" size="sm" onClick={onOpenNew}>
          <Building2 className="h-4 w-4 mr-1.5" />
          Nouvelle organisation
        </Button>
      }
    />
  );
});
