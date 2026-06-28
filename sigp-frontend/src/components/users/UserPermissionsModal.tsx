import { useState, useEffect } from 'react';
import { Shield } from 'lucide-react';
import { Button } from '@/components/ui/forms/Button';
import {
  Modal, ModalContent, ModalHeader, ModalTitle,
  ModalDescription, ModalFooter, ModalClose,
} from '@/components/ui/overlays/Modal';
import { PERMISSION_LABELS, type MockUser, type UserPermissions } from '@/mocks/usersMocks';
import { userAvatarStyle } from '@/components/users/userAvatarStyle';

// ─────────────────────────────────────────────────────────────────────────────
// Inline accessible Switch — aucun composant design system disponible
// ─────────────────────────────────────────────────────────────────────────────

function Switch({ checked, onChange, id }: { checked: boolean; onChange: (v: boolean) => void; id: string }) {
  return (
    <button
      type="button"
      id={id}
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`
        relative inline-flex h-5 w-9 items-center rounded-full transition-colors shrink-0
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
        ${checked ? 'bg-primary' : 'bg-input'}
      `}
    >
      <span
        className={`
          inline-block h-3.5 w-3.5 rounded-full bg-white shadow-sm transition-transform
          ${checked ? 'translate-x-4' : 'translate-x-1'}
        `}
      />
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// UserPermissionsModal
// ─────────────────────────────────────────────────────────────────────────────

export interface UserPermissionsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: MockUser | null;
  onSave: (userId: string, permissions: UserPermissions) => void;
}

const EMPTY_PERMS: UserPermissions = {
  projets: false, budget: false, marches: false, rapports: false,
  utilisateurs: false, parametres: false, export: false, audit: false,
};

export function UserPermissionsModal({ open, onOpenChange, user, onSave }: UserPermissionsModalProps) {
  const [perms, setPerms] = useState<UserPermissions>(user?.permissions ?? EMPTY_PERMS);

  // Re-sync when the selected user changes
  useEffect(() => {
    if (user) setPerms({ ...user.permissions });
  }, [user]);

  const permEntries = Object.entries(PERMISSION_LABELS) as [keyof UserPermissions, string][];
  const avatarStyle = user ? userAvatarStyle(user.initiales) : '';

  function toggle(key: keyof UserPermissions) {
    setPerms((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  function handleSave() {
    if (!user) return;
    onSave(user.id, { ...perms });
    onOpenChange(false);
  }

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent className="sm:max-w-md">
        <ModalHeader>
          <ModalTitle className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" aria-hidden="true" />
            Gérer les permissions
          </ModalTitle>
          {user && (
            <ModalDescription className="mt-1">
              <span className="flex items-center gap-2">
                <span
                  className={`h-6 w-6 rounded-full inline-flex items-center justify-center text-[10px] font-bold shrink-0 ${avatarStyle}`}
                  aria-hidden="true"
                >
                  {user.initiales}
                </span>
                <span className="text-foreground font-medium">{user.prenom} {user.nom}</span>
                <span>· {user.roleLabel}</span>
              </span>
            </ModalDescription>
          )}
        </ModalHeader>

        <div className="flex flex-col gap-2 py-1">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-1">
            Modules accessibles
          </p>
          <div className="rounded-lg border border-border overflow-hidden">
            {permEntries.map(([key, label], idx) => (
              <label
                key={key}
                htmlFor={`perm-${key}`}
                className={`flex items-center justify-between gap-3 px-4 py-3 bg-background hover:bg-muted/40 cursor-pointer ${idx > 0 ? 'border-t border-border' : ''}`}
              >
                <span className={`text-[13px] font-medium select-none ${perms[key] ? 'text-foreground' : 'text-muted-foreground'}`}>
                  {label}
                </span>
                <Switch
                  id={`perm-${key}`}
                  checked={perms[key]}
                  onChange={() => toggle(key)}
                />
              </label>
            ))}
          </div>
        </div>

        <ModalFooter>
          <ModalClose asChild>
            <Button variant="outline">Annuler</Button>
          </ModalClose>
          <Button variant="default" onClick={handleSave}>
            Enregistrer
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
