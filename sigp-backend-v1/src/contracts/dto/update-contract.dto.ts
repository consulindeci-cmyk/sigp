import { ApiPropertyOptional } from '@nestjs/swagger';
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

export class UpdateContractDto {
  @ApiPropertyOptional({ description: 'Identifiant du marché PPM (optionnel)' })
  @IsOptional()
  @IsUUID()
  marcheId?: string;

  @ApiPropertyOptional({ description: 'Numéro du contrat', maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  numero?: string;

  @ApiPropertyOptional({ description: 'Intitulé du contrat', maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  intitule?: string;

  @ApiPropertyOptional({ enum: ContractType })
  @IsOptional()
  @IsEnum(ContractType)
  type?: ContractType;

  @ApiPropertyOptional({ enum: ContractStatus })
  @IsOptional()
  @IsEnum(ContractStatus)
  statut?: ContractStatus;

  @ApiPropertyOptional({ description: 'Titulaire du contrat', maxLength: 255 })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  titulaire?: string;

  @ApiPropertyOptional({ description: 'Montant du contrat' })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  montant?: number;

  @ApiPropertyOptional({ description: 'Devise' })
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
