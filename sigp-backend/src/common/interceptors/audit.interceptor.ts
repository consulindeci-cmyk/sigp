import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { PrismaService } from '../../prisma/prisma.service';
import { ActionAudit } from '@prisma/client';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditInterceptor.name);

  constructor(private readonly prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const method = request.method as string;
    const url = request.url as string;

    const mutatingMethods = ['POST', 'PATCH', 'PUT', 'DELETE'];
    if (!mutatingMethods.includes(method)) {
      return next.handle();
    }

    const user = request.user;
    const ip = request.ip ?? request.connection?.remoteAddress;
    const userAgent = request.headers['user-agent'];
    const bodyBefore = { ...request.body };

    let action: ActionAudit = ActionAudit.MODIFICATION;
    if (method === 'POST') action = ActionAudit.CREATION;
    if (method === 'DELETE') action = ActionAudit.SUPPRESSION;

    const module = this.extractModule(url);

    return next.handle().pipe(
      tap({
        next: (responseBody) => {
          this.logAudit({
            utilisateur_id: user?.id ?? null,
            action,
            module,
            entite_id: responseBody?.id ?? request.params?.id ?? null,
            ancienne_valeur: method !== 'POST' ? bodyBefore : null,
            nouvelle_valeur: responseBody ?? null,
            adresse_ip: ip,
            user_agent: userAgent,
          }).catch((err) => this.logger.error('Audit log error', err));
        },
        error: () => {
          // Ne pas logguer les erreurs dans l'audit
        },
      }),
    );
  }

  private extractModule(url: string): string {
    const segments = url.replace(/^\//, '').split('/');
    if (segments[0] === 'projects' && segments.length > 2) {
      return segments[2] ?? segments[0];
    }
    return segments[0] ?? 'unknown';
  }

  private async logAudit(data: {
    utilisateur_id: string | null;
    action: ActionAudit;
    module: string;
    entite_id: string | null;
    ancienne_valeur: any;
    nouvelle_valeur: any;
    adresse_ip: string;
    user_agent: string;
  }): Promise<void> {
    await this.prisma.auditLog.create({
      data: {
        utilisateur_id: data.utilisateur_id,
        action: data.action,
        module: data.module,
        entite_id: data.entite_id,
        ancienne_valeur: data.ancienne_valeur
          ? JSON.parse(JSON.stringify(data.ancienne_valeur))
          : undefined,
        nouvelle_valeur: data.nouvelle_valeur
          ? JSON.parse(JSON.stringify(data.nouvelle_valeur))
          : undefined,
        adresse_ip: data.adresse_ip,
        user_agent: data.user_agent,
      },
    });
  }
}
