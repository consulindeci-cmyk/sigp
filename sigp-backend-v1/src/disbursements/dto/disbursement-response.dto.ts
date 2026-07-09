import { ApiProperty } from '@nestjs/swagger';
import { Disbursement, DisbursementStatus } from '@prisma/client';

export class DisbursementResponseDto {
  @ApiProperty({ example: 'a1b2c3d4-0000-4000-8000-ef1234567890' })
  id: string;

  @ApiProperty({ example: 'b2c3d4e5-0000-4000-8000-ef1234567890', nullable: true })
  budgetVersionId: string | null;

  @ApiProperty({ example: 'c3d4e5f6-0000-4000-8000-ef1234567890', nullable: true })
  budgetLineId: string | null;

  @ApiProperty({ example: 'd4e5f6a7-0000-4000-8000-ef1234567890', nullable: true })
  contractId: string | null;

  @ApiProperty({ example: 'e5f6a7b8-0000-4000-8000-ef1234567890', nullable: true })
  fundingSourceId: string | null;

  @ApiProperty({ enum: DisbursementStatus, example: DisbursementStatus.PLANIFIE })
  statut: DisbursementStatus;

  @ApiProperty({ example: 5000000 })
  montant: number;

  @ApiProperty({ example: '2026-06-01T00:00:00.000Z', nullable: true })
  datePrevue: Date | null;

  @ApiProperty({ example: '2026-06-15T00:00:00.000Z', nullable: true })
  dateReelle: Date | null;

  @ApiProperty({ example: 'DEC-2026-001', nullable: true })
  reference: string | null;

  @ApiProperty({ example: 'Premier décaissement de la composante 1', nullable: true })
  description: string | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  static fromEntity(entity: Disbursement): DisbursementResponseDto {
    return {
      id: entity.id,
      budgetVersionId: entity.budget_version_id ?? null,
      budgetLineId: entity.budget_ligne_id ?? null,
      contractId: entity.contract_id ?? null,
      fundingSourceId: entity.funding_source_id ?? null,
      statut: entity.statut,
      montant: Number(entity.montant),
      datePrevue: entity.date_prevue ?? null,
      dateReelle: entity.date_reelle ?? null,
      reference: entity.reference ?? null,
      description: entity.description ?? null,
      createdAt: entity.created_at,
      updatedAt: entity.updated_at,
    };
  }
}
