import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { NiveauIntervention } from '@prisma/client';

export class CreateLogframeDto {
  @ApiProperty({ enum: NiveauIntervention })
  @IsEnum(NiveauIntervention)
  niveau_intervention: NiveauIntervention;

  @ApiProperty({ example: "Taux d'accès à l'eau potable" })
  @IsString()
  @IsNotEmpty()
  indicateur: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  valeur_reference?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  cible?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  source_verification?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  hypotheses?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  risques?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  commentaires?: string;
}

export class UpdateLogframeDto {
  @ApiPropertyOptional({ enum: NiveauIntervention })
  @IsOptional()
  @IsEnum(NiveauIntervention)
  niveau_intervention?: NiveauIntervention;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  indicateur?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  valeur_reference?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  cible?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  source_verification?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  hypotheses?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  risques?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  commentaires?: string;
}
