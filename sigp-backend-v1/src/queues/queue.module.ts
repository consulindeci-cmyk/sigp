import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { QUEUE_NAMES } from './queue.constants';

@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        connection: {
          host: config.get<string>('REDIS_HOST', 'localhost'),
          port: config.get<number>('REDIS_PORT', 6379),
          password: config.get<string>('REDIS_PASSWORD') || undefined,
          db: config.get<number>('REDIS_DB', 0),
          lazyConnect: true,
          maxRetriesPerRequest: null,
          retryStrategy(times) {
            if (times > 5) return null;
            return Math.min(times * 500, 2000);
          },
        },
        defaultJobOptions: {
          attempts: 3,
          backoff: { type: 'exponential', delay: 2000 },
          removeOnComplete: 100,
          removeOnFail: 500,
        },
      }),
      inject: [ConfigService],
    }),
    BullModule.registerQueue(
      { name: QUEUE_NAMES.EXPORTS },
      { name: QUEUE_NAMES.REPORTS },
      { name: QUEUE_NAMES.NOTIFICATIONS },
      { name: QUEUE_NAMES.EMAILS },
    ),
  ],
  exports: [BullModule],
})
export class QueueModule {}
