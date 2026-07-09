import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Marque une route comme publique — le JwtAuthGuard laisse passer sans token.
 * À utiliser sur les endpoints non protégés : login, refresh, health...
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
