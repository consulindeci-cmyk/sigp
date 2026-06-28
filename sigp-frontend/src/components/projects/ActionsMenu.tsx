import React from 'react';
import { MoreHorizontal } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/overlays/DropdownMenu';
import { Button } from '@/components/ui/forms/Button';
import { cn } from '@/lib/utils';

// ─────────────────────────────────────────────────────────────────────────────
// Generic reusable actions menu — works for Projects, Users, Contracts, etc.
// ─────────────────────────────────────────────────────────────────────────────

export interface ActionItem {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  variant?: 'default' | 'destructive';
  separator?: boolean;
  disabled?: boolean;
}

export interface ActionsMenuProps {
  actions: ActionItem[];
  'aria-label'?: string;
  align?: 'start' | 'center' | 'end';
}

export function ActionsMenu({ actions, 'aria-label': ariaLabel, align = 'end' }: ActionsMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 data-[state=open]:bg-muted"
          aria-label={ariaLabel ?? 'Ouvrir le menu des actions'}
        >
          <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align} className="w-44">
        {actions.map((action, idx) => (
          <React.Fragment key={idx}>
            {action.separator && <DropdownMenuSeparator />}
            <DropdownMenuItem
              onClick={action.onClick}
              disabled={action.disabled}
              className={cn(
                'flex items-center gap-2 cursor-pointer',
                action.variant === 'destructive' && 'text-destructive focus:text-destructive',
              )}
            >
              <span className="h-4 w-4 shrink-0 flex items-center justify-center" aria-hidden="true">
                {action.icon}
              </span>
              {action.label}
            </DropdownMenuItem>
          </React.Fragment>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
