import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AuditAction } from '@prisma/client';
import { AuditService } from '@/audit/audit.service';
import { AppEvent } from '@/shared/constants/app-events.enum';
import { ErrorCode } from '@/shared/constants/error-codes.enum';
import { NotFoundException } from '@/common/exceptions/business.exception';
import { PaginatedResult, paginate, paginationToSkipTake } from '@/shared/dto/pagination.dto';
import { UsersService } from '@/users/users.service';
import { NotificationRepository } from './notification.repository';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import { NotificationQueryDto } from './dto/notification-query.dto';
import { NotificationResponseDto } from './dto/notification-response.dto';

const SORTABLE_FIELDS = ['type', 'titre', 'lue', 'expires_at', 'created_at', 'updated_at'] as const;

export interface ActorContext {
  userId?: string;
  ip?: string;
  userAgent?: string;
}

@Injectable()
export class NotificationService {
  constructor(
    private readonly notificationRepository: NotificationRepository,
    private readonly usersService: UsersService,
    private readonly auditService: AuditService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async findAll(query: NotificationQueryDto): Promise<PaginatedResult<NotificationResponseDto>> {
    const { skip, take } = paginationToSkipTake(query);

    const sortField =
      query.sortBy && (SORTABLE_FIELDS as readonly string[]).includes(query.sortBy)
        ? query.sortBy
        : 'created_at';
    const sortOrder = query.sortOrder === 'asc' ? 'asc' : 'desc';

    const { notifications, total } = await this.notificationRepository.findManyPaginated({
      skip,
      take,
      search: query.search,
      userId: query.userId,
      projectId: query.projectId,
      type: query.type,
      lue: query.lue,
      orderBy: { [sortField]: sortOrder },
    });

    return paginate(notifications.map(NotificationResponseDto.fromEntity), total, query);
  }

  async findOne(id: string): Promise<NotificationResponseDto> {
    const notification = await this.notificationRepository.findById(id);
    if (!notification) {
      throw new NotFoundException(ErrorCode.NOTIFICATION_NOT_FOUND, 'Notification introuvable');
    }
    return NotificationResponseDto.fromEntity(notification);
  }

  async create(
    dto: CreateNotificationDto,
    actor: ActorContext = {},
  ): Promise<NotificationResponseDto> {
    await this.usersService.findOne(dto.userId);

    const notification = await this.notificationRepository.create({
      userId: dto.userId,
      projectId: dto.projectId ?? null,
      type: dto.type,
      titre: dto.titre,
      message: dto.message,
      lue: dto.lue ?? false,
      data: dto.data ?? null,
      expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
      createdBy: actor.userId ?? null,
    });

    const response = NotificationResponseDto.fromEntity(notification);

    setImmediate(() => {
      void this.auditService.log({
        userId: actor.userId,
        action: AuditAction.CREATE,
        tableCible: 'notifications',
        enregistrementId: notification.id,
        apres: { ...response },
        ipAddress: actor.ip,
        userAgent: actor.userAgent,
      });
    });

    this.eventEmitter.emit(AppEvent.NOTIFICATION_CREATED, {
      notificationId: notification.id,
      userId: notification.user_id,
    });

    return response;
  }

  async update(
    id: string,
    dto: UpdateNotificationDto,
    actor: ActorContext = {},
  ): Promise<NotificationResponseDto> {
    const existing = await this.notificationRepository.findById(id);
    if (!existing) {
      throw new NotFoundException(ErrorCode.NOTIFICATION_NOT_FOUND, 'Notification introuvable');
    }

    const before = NotificationResponseDto.fromEntity(existing);

    const updated = await this.notificationRepository.update(id, {
      type: dto.type,
      titre: dto.titre,
      message: dto.message,
      lue: dto.lue,
      data: dto.data,
      expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined,
      updatedBy: actor.userId ?? null,
    });

    const response = NotificationResponseDto.fromEntity(updated);

    setImmediate(() => {
      void this.auditService.log({
        userId: actor.userId,
        action: AuditAction.UPDATE,
        tableCible: 'notifications',
        enregistrementId: id,
        avant: { ...before },
        apres: { ...response },
        ipAddress: actor.ip,
        userAgent: actor.userAgent,
      });
    });

    this.eventEmitter.emit(AppEvent.NOTIFICATION_UPDATED, { notificationId: id });

    return response;
  }

  async remove(id: string, actor: ActorContext = {}): Promise<void> {
    const existing = await this.notificationRepository.findById(id);
    if (!existing) {
      throw new NotFoundException(ErrorCode.NOTIFICATION_NOT_FOUND, 'Notification introuvable');
    }

    await this.notificationRepository.softDelete(id);

    setImmediate(() => {
      void this.auditService.log({
        userId: actor.userId,
        action: AuditAction.DELETE,
        tableCible: 'notifications',
        enregistrementId: id,
        avant: { ...NotificationResponseDto.fromEntity(existing) },
        ipAddress: actor.ip,
        userAgent: actor.userAgent,
      });
    });

    this.eventEmitter.emit(AppEvent.NOTIFICATION_DELETED, {
      notificationId: id,
      userId: existing.user_id,
    });
  }
}
