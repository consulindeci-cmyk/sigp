import React from 'react';
import { UserPlus } from 'lucide-react';
import { PageHeader } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/forms/Button';

export interface UsersToolbarProps {
  onOpenNew: () => void;
  canCreate?: boolean;
}

export const UsersToolbar = React.memo(function UsersToolbar({ onOpenNew, canCreate = true }: UsersToolbarProps) {
  return (
    <PageHeader
      title="Gestion des utilisateurs"
      subtitle="Administration des comptes, des rôles système et des accès du portefeuille"
      actions={
        canCreate ? (
          <Button variant="default" size="sm" onClick={onOpenNew}>
            <UserPlus className="h-4 w-4 mr-1.5" />
            Nouvel utilisateur
          </Button>
        ) : undefined
      }
    />
  );
});
