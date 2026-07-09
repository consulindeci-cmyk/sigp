import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Contract, ContractStatus, ContractType } from '@prisma/client';

export class ContractResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() projectId: string;
  @ApiPropertyOptional() marcheId: string | null;
  @ApiProperty() numero: string;
  @ApiProperty() intitule: string;
  @ApiProperty({ enum: ContractType }) type: ContractType;
  @ApiProperty({ enum: ContractStatus }) statut: ContractStatus;
  @ApiProperty() titulaire: string;
  @ApiProperty() montant: number;
  @ApiProperty() devise: string;
  @ApiPropertyOptional() dateSignature: Date | null;
  @ApiPropertyOptional() dateDebut: Date | null;
  @ApiPropertyOptional() dateFin: Date | null;
  @ApiPropertyOptional() notes: string | null;
  @ApiPropertyOptional() createdBy: string | null;
  @ApiPropertyOptional() updatedBy: string | null;
  @ApiProperty() createdAt: Date;
  @ApiProperty() updatedAt: Date;

  static fromEntity(entity: Contract): ContractResponseDto {
    return {
      id: entity.id,
      projectId: entity.project_id,
      marcheId: entity.marche_id ?? null,
      numero: entity.numero,
      intitule: entity.intitule,
      type: entity.type,
      statut: entity.statut,
      titulaire: entity.titulaire,
      montant: Number(entity.montant),
      devise: entity.devise,
      dateSignature: entity.date_signature ?? null,
      dateDebut: entity.date_debut ?? null,
      dateFin: entity.date_fin ?? null,
      notes: entity.notes ?? null,
      createdBy: entity.created_by ?? null,
      updatedBy: entity.updated_by ?? null,
      createdAt: entity.created_at,
      updatedAt: entity.updated_at,
    };
  }
}
