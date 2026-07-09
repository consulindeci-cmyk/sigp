import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { TypeNotification } from '@prisma/client';

export class UpdateNotificationDto {
  @ApiPropertyOptional({ enum: TypeNotification, description: 'Type de notification' })
  @IsOptional()
  @IsEnum(TypeNotification)
  type?: TypeNotification;

  @ApiPropertyOptional({ description: 'Titre de la notification', maxLength: 200 })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  titre?: string;

  @ApiPropertyOptional({ description: 'Corps du message' })
  @IsOptional()
  @IsString()
  message?: string;

  @ApiPropertyOptional({ description: 'Marquer comme lue / non lue' })
  @IsOptional()
  @IsBoolean()
  lue?: boolean;

  @ApiPropertyOptional({ description: 'Données JSON additionnelles' })
  @IsOptional()
  @IsObject()
  data?: Record<string, unknown>;

  @ApiPropertyOptional({ description: "Date d'expiration (ISO 8601)" })
  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}
