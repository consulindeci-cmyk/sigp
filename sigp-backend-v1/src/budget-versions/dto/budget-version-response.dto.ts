import { ApiProperty } from '@nestjs/swagger';
import { BudgetStatus, BudgetVersion } from '@prisma/client';

export class BudgetVersionResponseDto {
  @ApiProperty({ example: 'a1b2c3d4-0000-4000-8000-ef1234567890' })
  id: string;

  @ApiProperty({ example: 'a1b2c3d4-0000-4000-8000-ef1234567890' })
  projectId: string;

  @ApiProperty({ example: 1 })
  version: number;

  @ApiProperty({ example: 'Budget initial 2026' })
  nom: string;

  @ApiProperty({ enum: BudgetStatus, example: BudgetStatus.BROUILLON })
  statut: BudgetStatus;

  @ApiProperty({ example: 150000000 })
  montantTotal: number;

  @ApiProperty({ example: 'b2c3d4e5-0000-4000-8000-ef1234567890', nullable: true })
  approvePar: string | null;

  @ApiProperty({ example: '2026-03-15T00:00:00.000Z', nullable: true })
  approuveLe: Date | null;

  @ApiProperty({ example: 'Budget approuvé en comité de pilotage', nullable: true })
  notes: string | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  static fromEntity(entity: BudgetVersion): BudgetVersionResponseDto {
    return {
      id: entity.id,
      projectId: entity.project_id,
      version: entity.version,
      nom: entity.nom,
      statut: entity.statut,
      montantTotal: Number(entity.montant_total),
      approvePar: entity.approuve_par ?? null,
      approuveLe: entity.approuve_le ?? null,
      notes: entity.notes ?? null,
      createdAt: entity.created_at,
      updatedAt: entity.updated_at,
    };
  }
}
