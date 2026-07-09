import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Notification, TypeNotification } from '@prisma/client';

export class NotificationResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() userId: string;
  @ApiPropertyOptional() projectId: string | null;
  @ApiProperty({ enum: TypeNotification }) type: TypeNotification;
  @ApiProperty() titre: string;
  @ApiProperty() message: string;
  @ApiProperty() lue: boolean;
  @ApiPropertyOptional() data: Record<string, unknown> | null;
  @ApiPropertyOptional() expiresAt: Date | null;
  @ApiPropertyOptional() createdBy: string | null;
  @ApiPropertyOptional() updatedBy: string | null;
  @ApiProperty() createdAt: Date;
  @ApiProperty() updatedAt: Date;

  static fromEntity(entity: Notification): NotificationResponseDto {
    return {
      id: entity.id,
      userId: entity.user_id,
      projectId: entity.project_id ?? null,
      type: entity.type,
      titre: entity.titre,
      message: entity.message,
      lue: entity.lue,
      data: (entity.data as Record<string, unknown> | null) ?? null,
      expiresAt: entity.expires_at ?? null,
      createdBy: entity.created_by ?? null,
      updatedBy: entity.updated_by ?? null,
      createdAt: entity.created_at,
      updatedAt: entity.updated_at,
    };
  }
}
