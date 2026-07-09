import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TypeNotification } from '@prisma/client';

export class CreateNotificationDto {
  @ApiProperty({ description: "ID de l'utilisateur destinataire", format: 'uuid' })
  @IsUUID()
  userId: string;

  @ApiPropertyOptional({ description: 'ID du projet associé', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  projectId?: string;

  @ApiProperty({ enum: TypeNotification, description: 'Type de notification' })
  @IsEnum(TypeNotification)
  type: TypeNotification;

  @ApiProperty({ description: 'Titre de la notification', maxLength: 200 })
  @IsString()
  @MaxLength(200)
  titre: string;

  @ApiProperty({ description: 'Corps du message' })
  @IsString()
  message: string;

  @ApiPropertyOptional({ description: 'Notification déjà lue', default: false })
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
