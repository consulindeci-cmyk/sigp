import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';
import { LedgerService, CreateLogDto } from './ledger.service';

@Injectable()
export class OutboxRelayWorker {
  private readonly logger = new Logger(OutboxRelayWorker.name);
  private isProcessing = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly ledger: LedgerService,
  ) {}

  // Exécution toutes les 5 secondes (pour l'exemple)
  @Cron('*/5 * * * * *')
  async processOutbox() {
    if (this.isProcessing) return;
    this.isProcessing = true;

    try {
      // 1. Récupérer les événements en attente (PENDING)
      // En SQL pur on utiliserait "SELECT FOR UPDATE SKIP LOCKED" pour éviter la concurrence entre plusieurs workers.
      // Dans Prisma, pour un POC/MVP, on récupère et on update le statut à PROCESSING (ou on traite séquentiellement).
      const events = await this.prisma.outboxEvent.findMany({
        where: { status: 'PENDING' },
        orderBy: { createdAt: 'asc' },
        take: 50,
      });

      if (events.length === 0) {
        this.isProcessing = false;
        return;
      }

      this.logger.debug(`Traitement de ${events.length} événement(s) Outbox...`);

      for (const event of events) {
        try {
          // Décoder le payload
          const payload = event.payload as any;
          
          const dto: CreateLogDto = {
            projet_id: payload.projet_id,
            type_evenement: payload.type_evenement,
            entite_type: payload.entite_type,
            entite_id: event.aggregateId,
            entite_snapshot: payload.snapshot,
            montant_engage: payload.montant_engage,
            montant_decaisse: payload.montant_decaisse,
            description: payload.description || `Mise à jour ${event.aggregateType}`,
            auteur_id: event.auteur_id,
            date_operation: event.createdAt,
          };

          // Insérer dans le Ledger
          await this.ledger.recordEvent(dto);

          // Marquer l'événement comme traité
          await this.prisma.outboxEvent.update({
            where: { id: event.id },
            data: { status: 'PROCESSED', processedAt: new Date() },
          });

        } catch (err: any) {
          this.logger.error(`Erreur sur l'event ${event.id}: ${err.message}`);
          await this.prisma.outboxEvent.update({
            where: { id: event.id },
            data: { status: 'FAILED', error: err.message },
          });
        }
      }
    } catch (error) {
      this.logger.error('Erreur globale lors du traitement de la Outbox', error);
    } finally {
      this.isProcessing = false;
    }
  }
}
