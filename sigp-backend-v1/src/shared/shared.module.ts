import { Global, Module } from '@nestjs/common';
import { RedisClientProvider, RedisShutdownService, REDIS_CLIENT } from './redis.provider';

@Global()
@Module({
  providers: [RedisClientProvider, RedisShutdownService],
  exports: [REDIS_CLIENT],
})
export class SharedModule {}
