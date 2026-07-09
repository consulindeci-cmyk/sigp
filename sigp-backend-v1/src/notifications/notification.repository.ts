import { Injectable } from '@nestjs/common';
import { Notification, Prisma, TypeNotification } from '@prisma/client';
import { InputJsonValue } from '@prisma/client/runtime/library';
import { PrismaService } from '@/prisma/prisma.service';

export interface CreateNotificationData {
  userId: string;
  projectId?: string | null;
  type: TypeNotification;
  titre: string;
  message: string;
  lue?: boolean;
  data?: Record<string, unknown> | null;
  expiresAt?: Date | null;
  createdBy?: string | null;
}

export interface UpdateNotificationData {
  type?: TypeNotification;
  titre?: string;
  message?: string;
  lue?: boolean;
  data?: Record<string, unknown> | null;
  expiresAt?: Date | null;
  updatedBy?: string | null;
}

export interface FindNotificationsParams {
  skip: number;
  take: number;
  search?: string;
  userId?: string;
  projectId?: string;
  type?: TypeNotification;
  lue?: boolean;
  orderBy: Prisma.NotificationOrderByWithRelationInput;
}

@Injectable()
export class NotificationRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findManyPaginated(
    params: FindNotificationsParams,
  ): Promise<{ notifications: Notification[]; total: number }> {
    const where = this.buildWhere(params);

    const [notifications, total] = await this.prisma.$transaction([
      this.prisma.notification.findMany({
        where,
        skip: params.skip,
        take: params.take,
        orderBy: params.orderBy,
      }),
      this.prisma.notification.count({ where }),
    ]);

    return { notifications, total };
  }

  findById(id: string): Promise<Notification | null> {
    return this.prisma.notification.findFirst({ where: { id } });
  }

  findByUser(userId: string): Promise<Notification[]> {
    return this.prisma.notification.findMany({ where: { user_id: userId } });
  }

  create(data: CreateNotificationData): Promise<Notification> {
    return this.prisma.notification.create({
      data: {
        user_id: data.userId,
        project_id: data.projectId ?? null,
        type: data.type,
        titre: data.titre,
        message: data.message,
        lue: data.lue ?? false,
        data: data.data ? (data.data as InputJsonValue) : undefined,
        expires_at: data.expiresAt ?? null,
        created_by: data.createdBy ?? null,
      },
    });
  }

  update(id: string, data: UpdateNotificationData): Promise<Notification> {
    return this.prisma.notification.update({
      where: { id },
      data: {
        type: data.type,
        titre: data.titre,
        message: data.message,
        lue: data.lue,
        data: data.data ? (data.data as InputJsonValue) : undefined,
        expires_at: data.expiresAt,
        updated_by: data.updatedBy,
      },
    });
  }

  async softDelete(id: string): Promise<void> {
    await this.prisma.notification.update({ where: { id }, data: { deleted_at: new Date() } });
  }

  private buildWhere(params: FindNotificationsParams): Prisma.NotificationWhereInput {
    const where: Prisma.NotificationWhereInput = {};

    if (params.userId) {
      where.user_id = params.userId;
    }
    if (params.projectId) {
      where.project_id = params.projectId;
    }
    if (params.type) {
      where.type = params.type;
    }
    if (params.lue !== undefined) {
      where.lue = params.lue;
    }
    if (params.search) {
      where.OR = [
        { titre: { contains: params.search, mode: 'insensitive' } },
        { message: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    return where;
  }
}
