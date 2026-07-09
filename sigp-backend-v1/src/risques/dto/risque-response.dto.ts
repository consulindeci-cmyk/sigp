import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RiskImpact, RiskProbability, RiskStatus, Risque } from '@prisma/client';

export class RisqueResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() projectId: string;
  @ApiPropertyOptional() wbsId: string | null;
  @ApiPropertyOptional() code: string | null;
  @ApiProperty() description: string;
  @ApiPropertyOptional() categorie: string | null;
  @ApiProperty({ enum: RiskProbability }) probabilite: RiskProbability;
  @ApiProperty({ enum: RiskImpact }) impact: RiskImpact;
  @ApiProperty() niveauCriticite: string;
  @ApiProperty({ enum: RiskStatus }) statut: RiskStatus;
  @ApiPropertyOptional() strategie: string | null;
  @ApiPropertyOptional() planAction: string | null;
  @ApiPropertyOptional() responsableId: string | null;
  @ApiPropertyOptional() dateDetection: Date | null;
  @ApiPropertyOptional() dateEcheance: Date | null;
  @ApiPropertyOptional() createdBy: string | null;
  @ApiPropertyOptional() updatedBy: string | null;
  @ApiProperty() createdAt: Date;
  @ApiProperty() updatedAt: Date;

  static fromEntity(entity: Risque): RisqueResponseDto {
    return {
      id: entity.id,
      projectId: entity.project_id,
      wbsId: entity.wbs_id ?? null,
      code: entity.code ?? null,
      description: entity.description,
      categorie: entity.categorie ?? null,
      probabilite: entity.probabilite,
      impact: entity.impact,
      niveauCriticite: entity.niveau_criticite,
      statut: entity.statut,
      strategie: entity.strategie ?? null,
      planAction: entity.plan_action ?? null,
      responsableId: entity.responsable_id ?? null,
      dateDetection: entity.date_detection ?? null,
      dateEcheance: entity.date_echeance ?? null,
      createdBy: entity.created_by ?? null,
      updatedBy: entity.updated_by ?? null,
      createdAt: entity.created_at,
      updatedAt: entity.updated_at,
    };
  }
}
