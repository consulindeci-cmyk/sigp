import { Injectable, OnModuleDestroy, OnModuleInit, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { softDeleteExtension } from './middleware/soft-delete.middleware';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super();
    // Prisma 6: $use removed — apply soft-delete extension via Object.assign.
    // This replaces model delegates on this instance with extension-wrapped versions.
    const extended = this.$extends(softDeleteExtension);
    Object.assign(this, extended);
  }

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log('Prisma connected');
    } catch (err) {
      this.logger.warn(`Prisma initial connection failed on startup: ${err instanceof Error ? err.message : err}. Will reconnect on query.`);
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log('Prisma disconnected');
  }
}
