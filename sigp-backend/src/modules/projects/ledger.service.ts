import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TypeJournalEvent, TypeEntiteLiee } from '@prisma/client';
import * as crypto from 'crypto';

export interface CreateLogDto {
  projet_id: string;
  type_evenement: TypeJournalEvent;
  entite_type: TypeEntiteLiee;
  entite_id: string;
  entite_snapshot?: any;
  montant_engage?: number;
  montant_decaisse?: number;
  description: string;
  auteur_id: string;
  date_operation?: Date;
}

@Injectable()
export class LedgerService {
  private readonly logger = new Logger(LedgerService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Enregistre un log immuable dans le Ledger.
   * Doit être appelé par le Outbox Relay Worker (ou via une transaction).
   */
  async recordEvent(dto: CreateLogDto) {
    const annee = new Date().getFullYear();
    
    // Le verrou n'est pas strictement nécessaire ici si le Relay Worker dépile séquentiellement,
    // mais par prudence on le récupère via une requête normale.
    const lastLog = await this.prisma.journalOperation.findFirst({
      where: { projet_id: dto.projet_id },
      orderBy: { numero_sequence: 'desc' }
    });
    
    // Le code_operation est formaté avec la séquence. 
    // Attention: numero_sequence est autoincrement global, donc nextSeq ici sert juste à l'affichage du projet, 
    // ou alors on utilise l'ID autoincrement généré par Postgres après l'insertion pour le code_operation.
    // L'approche la plus safe avec autoincrement est de laisser la DB le générer, puis de faire un UPDATE,
    // OU d'utiliser un count sur le projet. On va utiliser un count sur le projet pour le format du code_operation.
    const count = await this.prisma.journalOperation.count({
      where: { projet_id: dto.projet_id }
    });
    const nextSeq = count + 1;
    const code_operation = `OP-${annee}-${String(dto.projet_id).substring(0, 4).toUpperCase()}-${String(nextSeq).padStart(5, '0')}`;

    const previousHash = lastLog?.hash_signature || 'GENESIS';
    const dateOp = dto.date_operation || new Date();
    
    // Concaténation stricte des champs pour le hash (Proof of immutability)
    const dataToHash = [
      previousHash,
      dto.projet_id,
      dto.type_evenement,
      dto.entite_type,
      dto.entite_id,
      dto.montant_engage || 0,
      dto.montant_decaisse || 0,
      dto.auteur_id,
      dateOp.toISOString()
    ].join('|');
    
    const currentHash = crypto.createHash('sha256').update(dataToHash).digest('hex');

    return this.prisma.journalOperation.create({
      data: {
        code_operation,
        projet_id: dto.projet_id,
        type_evenement: dto.type_evenement,
        entite_type: dto.entite_type,
        entite_id: dto.entite_id,
        entite_snapshot: dto.entite_snapshot ? JSON.stringify(dto.entite_snapshot) : null,
        montant_engage: dto.montant_engage || 0,
        montant_decaisse: dto.montant_decaisse || 0,
        description: dto.description,
        auteur_id: dto.auteur_id,
        date_operation: dateOp,
        hash_signature: currentHash,
        previous_hash: previousHash
      }
    });
  }

  /**
   * Helper pour insérer un événement dans la table Outbox au sein d'une transaction Prisma.
   */
  async dispatchToOutbox(tx: any, eventData: {
    aggregateType: string;
    aggregateId: string;
    eventType: string;
    payload: any;
    auteur_id: string;
  }) {
    return tx.outboxEvent.create({
      data: {
        aggregateType: eventData.aggregateType,
        aggregateId: eventData.aggregateId,
        eventType: eventData.eventType,
        payload: eventData.payload,
        auteur_id: eventData.auteur_id,
        status: 'PENDING'
      }
    });
  }
}
