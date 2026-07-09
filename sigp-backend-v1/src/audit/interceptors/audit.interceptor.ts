import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuditService } from '../audit.service';
import { AuditAction } from '@prisma/client';
import { AuthenticatedRequest } from '@/auth/interfaces/user-request.interface';

const METHOD_TO_ACTION: Record<string, AuditAction> = {
  POST: AuditAction.CREATE,
  PUT: AuditAction.UPDATE,
  PATCH: AuditAction.UPDATE,
  DELETE: AuditAction.DELETE,
};

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private readonly auditService: AuditService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const action = METHOD_TO_ACTION[req.method];

    if (!action) {
      return next.handle();
    }

    const userId = req.user?.id;
    const ipAddress = req.ip ?? req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];
    const table = this.extractTable(req.url);

    return next.handle().pipe(
      tap(() => {
        // setImmediate garantit que la réponse HTTP est émise AVANT l'écriture d'audit
        setImmediate(() => {
          void this.auditService.log({ userId, action, tableCible: table, ipAddress, userAgent });
        });
      }),
    );
  }

  private extractTable(url: string): string {
    const parts = url.split('/').filter(Boolean);
    const versionIndex = parts.findIndex((p) => /^v\d+$/.test(p));
    return parts[versionIndex + 1] ?? 'unknown';
  }
}
