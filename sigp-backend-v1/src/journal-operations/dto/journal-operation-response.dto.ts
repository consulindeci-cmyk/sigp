import { ApiProperty } from '@nestjs/swagger';
import { JournalOperation, JournalType } from '@prisma/client';

export class JournalOperationResponseDto {
  @ApiProperty({ example: 'a1b2c3d4-0000-4000-8000-ef1234567890' })
  id: string;

  @ApiProperty({ example: 'a1b2c3d4-0000-4000-8000-ef1234567890' })
  budgetLineId: string;

  @ApiProperty({ enum: JournalType, example: JournalType.DEPENSE })
  type: JournalType;

  @ApiProperty({ example: 5000000 })
  montant: number;

  @ApiProperty({ example: '2026-03-15T00:00:00.000Z' })
  dateOperation: Date;

  @ApiProperty({ example: 'BON-2026-001', nullable: true })
  reference: string | null;

  @ApiProperty({ example: 'Paiement salaires mars 2026', nullable: true })
  description: string | null;

  @ApiProperty({ example: 'b2c3d4e5-0000-4000-8000-ef1234567890', nullable: true })
  pieceJointeId: string | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  static fromEntity(entity: JournalOperation): JournalOperationResponseDto {
    return {
      id: entity.id,
      budgetLineId: entity.budget_ligne_id,
      type: entity.type,
      montant: Number(entity.montant),
      dateOperation: entity.date_operation,
      reference: entity.reference ?? null,
      description: entity.description ?? null,
      pieceJointeId: entity.piece_jointe_id ?? null,
      createdAt: entity.created_at,
      updatedAt: entity.updated_at,
    };
  }
}
