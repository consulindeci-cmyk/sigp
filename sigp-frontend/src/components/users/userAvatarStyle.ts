// ─────────────────────────────────────────────────────────────────────────────
// Returns Tailwind class string for user avatar based on initials
// Deterministic color assignment — reusable across Users, Comments, etc.
// ─────────────────────────────────────────────────────────────────────────────

const STYLES = [
  'bg-primary/10 text-primary',
  'bg-success/10 text-success',
  'bg-warning/10 text-warning',
  'bg-info/10 text-info',
  'bg-destructive/10 text-destructive',
  'bg-secondary text-secondary-foreground',
] as const;

export function userAvatarStyle(initiales: string): string {
  const code = initiales.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return STYLES[code % STYLES.length];
}
