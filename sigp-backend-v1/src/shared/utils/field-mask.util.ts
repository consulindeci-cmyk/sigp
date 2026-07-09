// Masque les champs sensibles avant insertion dans historique (audit log)
const SENSITIVE_FIELDS = new Set([
  'mot_de_passe',
  'password',
  'token',
  'token_hash',
  'secret',
  'private_key',
  'api_key',
  'refresh_token',
  'access_token',
]);

const MASKED = '[MASQUÉ]';

export function maskSensitiveFields(
  obj: Record<string, unknown> | null | undefined,
): Record<string, unknown> | null {
  if (!obj) return obj ?? null;

  return Object.entries(obj).reduce<Record<string, unknown>>((acc, [key, value]) => {
    if (SENSITIVE_FIELDS.has(key.toLowerCase())) {
      acc[key] = MASKED;
    } else if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      acc[key] = maskSensitiveFields(value as Record<string, unknown>);
    } else {
      acc[key] = value;
    }
    return acc;
  }, {});
}

export function anonymizeIp(ip: string): string {
  if (ip.includes(':')) {
    // IPv6 — masquer les 4 derniers groupes
    const parts = ip.split(':');
    return parts.slice(0, 4).join(':') + ':****:****:****:****';
  }
  // IPv4 — masquer le dernier octet
  const parts = ip.split('.');
  parts[parts.length - 1] = '0';
  return parts.join('.');
}
