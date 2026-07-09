import { ApiPropertyOptional } from '@nestjs/swagger';
import { RiskImpact, RiskProbability, RiskStatus } from '@prisma/client';
import { IsDateString, IsEnum, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class UpdateRisqueDto {
  // projectId absent intentionnellement — non modifiable après création

  @ApiPropertyOptional({ description: 'Nœud WBS associé' })
  @IsOptional()
  @IsUUID()
  wbsId?: string;

  @ApiPropertyOptional({ description: 'Code unique du risque', maxLength: 20 })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  code?: string;

  @ApiPropertyOptional({ description: 'Description du risque' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Catégorie du risque', maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  categorie?: string;

  @ApiPropertyOptional({ enum: RiskProbability, description: 'Probabilité de survenance' })
  @IsOptional()
  @IsEnum(RiskProbability)
  probabilite?: RiskProbability;

  @ApiPropertyOptional({ enum: RiskImpact, description: 'Impact potentiel' })
  @IsOptional()
  @IsEnum(RiskImpact)
  impact?: RiskImpact;

  @ApiPropertyOptional({ enum: RiskStatus, description: 'Statut du risque' })
  @IsOptional()
  @IsEnum(RiskStatus)
  statut?: RiskStatus;

  @ApiPropertyOptional({ description: 'Stratégie de réponse au risque' })
  @IsOptional()
  @IsString()
  strategie?: string;

  @ApiPropertyOptional({ description: "Plan d'action associé" })
  @IsOptional()
  @IsString()
  planAction?: string;

  @ApiPropertyOptional({ description: 'Responsable du risque (UUID)' })
  @IsOptional()
  @IsUUID()
  responsableId?: string;

  @ApiPropertyOptional({ description: 'Date de détection (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  dateDetection?: string;

  @ApiPropertyOptional({ description: "Date d'échéance (ISO 8601)" })
  @IsOptional()
  @IsDateString()
  dateEcheance?: string;
}
