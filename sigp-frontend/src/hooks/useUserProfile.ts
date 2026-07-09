import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/authStore';
import api from '@/lib/axios';
import type { UserProfile } from '@/mocks/settingsMocks';

// ── Role labels ───────────────────────────────────────────────────────────────

const ROLE_LABELS: Record<string, string> = {
  ADMIN:                         'Administrateur',
  COORDINATEUR:                  'Coordonnateur',
  CHARGE_PROGRAMME:              'Chargé de Programme',
  FINANCIER:                     'Responsable Financier',
  AUDITEUR:                      'Auditeur',
  VIEWER:                        'Observateur',
  SUPER_ADMIN:                   'Super Administrateur',
  ADMIN_PROJET:                  'Administrateur Projet',
  COORDONNATEUR_PROJET:          'Coordonnateur Projet',
  RESPONSABLE_SUIVI_EVALUATION:  'Responsable Suivi-Évaluation',
  RESPONSABLE_FINANCIER:         'Responsable Financier',
  RESPONSABLE_TECHNIQUE:         'Responsable Technique',
  RESPONSABLE_PASSATION_MARCHES: 'Responsable Passation Marchés',
  BAILLEUR:                      'Bailleur',
  OBSERVATEUR:                   'Observateur',
};

export const DEFAULT_USER_PROFILE: UserProfile = {
  id:               '',
  prenom:           '',
  nom:              '',
  initiales:        '??',
  email:            '',
  telephone:        '',
  poste:            '',
  organisation:     'SIGP — Système Intégré de Gestion de Projets',
  bio:              '',
  role:             'OBSERVATEUR',
  roleLabel:        'Observateur',
  actif:            true,
  dateInscription:  '—',
  dernierAcces:     '—',
  projetsAffecter:  [],
};

// ── Hook: current user profile built from JWT stored in authStore ─────────────
// No /me endpoint exists — profile data comes from the decoded JWT on login.

export function useCurrentUserProfile(): UserProfile {
  const user = useAuthStore(state => state.user);
  if (!user) return DEFAULT_USER_PROFILE;

  const initiales =
    `${user.prenom?.[0] ?? ''}${user.nom?.[0] ?? ''}`.toUpperCase() || '??';

  const dateInscription = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString('fr-FR', {
        day: 'numeric', month: 'long', year: 'numeric',
      })
    : '—';

  return {
    ...DEFAULT_USER_PROFILE,
    id:              user.id,
    prenom:          user.prenom,
    nom:             user.nom,
    initiales,
    email:           user.email,
    role:            user.role,
    roleLabel:       ROLE_LABELS[user.role] ?? user.role,
    actif:           user.actif,
    dateInscription,
  };
}

// ── Hook: update profile (nom, prenom, telephone) via PATCH /users/:id ────────

export interface UpdateProfilePayload {
  id:         string;
  prenom?:    string;
  nom?:       string;
  telephone?: string;
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: UpdateProfilePayload) =>
      api.patch(`/users/${id}`, data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
    onError:   () => qc.invalidateQueries({ queryKey: ['users'] }),
  });
}
