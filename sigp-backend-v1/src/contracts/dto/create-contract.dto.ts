import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { ContractStatus, ContractType } from '@prisma/client';

export class CreateContractDto {
  @ApiProperty({ description: 'Identifiant du projet' })
  @IsUUID()
  projectId: string;

  @ApiPropertyOptional({ description: 'Identifiant du marché PPM (optionnel, non validé)' })
  @IsOptional()
  @IsUUID()
  marcheId?: string;

  @ApiPropertyOptional({
    description: 'Source de financement liée (validation de cohérence uniquement)',
  })
  @IsOptional()
  @IsUUID()
  fundingSourceId?: string;

  @ApiProperty({ description: 'Numéro du contrat', maxLength: 100 })
  @IsString()
  @MaxLength(100)
  numero: string;

  @ApiProperty({ description: 'Intitulé du contrat', maxLength: 500 })
  @IsString()
  @MaxLength(500)
  intitule: string;

  @ApiPropertyOptional({ enum: ContractType, default: ContractType.MARCHE })
  @IsOptional()
  @IsEnum(ContractType)
  type?: ContractType;

  @ApiPropertyOptional({ enum: ContractStatus, default: ContractStatus.ACTIF })
  @IsOptional()
  @IsEnum(ContractStatus)
  statut?: ContractStatus;

  @ApiProperty({ description: 'Titulaire du contrat', maxLength: 255 })
  @IsString()
  @MaxLength(255)
  titulaire: string;

  @ApiProperty({ description: 'Montant du contrat' })
  @IsNumber()
  @IsPositive()
  montant: number;

  @ApiPropertyOptional({ description: 'Devise (défaut: XOF)', default: 'XOF' })
  @IsOptional()
  @IsString()
  @MaxLength(3)
  devise?: string;

  @ApiPropertyOptional({ description: 'Date de signature (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  dateSignature?: string;

  @ApiPropertyOptional({ description: 'Date de début (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  dateDebut?: string;

  @ApiPropertyOptional({ description: 'Date de fin (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  dateFin?: string;

  @ApiPropertyOptional({ description: 'Notes libres' })
  @IsOptional()
  @IsString()
  notes?: string;
}
