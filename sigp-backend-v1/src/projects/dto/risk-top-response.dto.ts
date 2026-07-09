import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RiskImpact, RiskProbability, RiskStatus, Risque } from '@prisma/client';

export class RiskTopResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() description: string;
  @ApiProperty() niveauCriticite: string;
  @ApiProperty({ enum: RiskProbability }) probabilite: RiskProbability;
  @ApiProperty({ enum: RiskImpact }) impact: RiskImpact;
  @ApiPropertyOptional() strategie: string | null;
  @ApiProperty({ enum: RiskStatus }) statut: RiskStatus;

  static fromEntity(entity: Risque): RiskTopResponseDto {
    return {
      id: entity.id,
      description: entity.description,
      niveauCriticite: entity.niveau_criticite,
      probabilite: entity.probabilite,
      impact: entity.impact,
      strategie: entity.strategie ?? null,
      statut: entity.statut,
    };
  }
}
