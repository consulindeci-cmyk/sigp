import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';

@Global()
@Module({
  imports: [
    WinstonModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const isProduction = configService.get('NODE_ENV') === 'production';
        const logLevel = configService.get<string>('LOG_LEVEL', 'debug');
        const pretty = configService.get<boolean>('LOG_PRETTY', true);

        const formats: winston.Logform.Format[] = [
          winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
          winston.format.errors({ stack: true }),
          winston.format.ms(),
        ];

        if (isProduction || !pretty) {
          formats.push(winston.format.json());
        } else {
          formats.push(
            winston.format.colorize({ all: true }),
            winston.format.printf(({ timestamp, level, message, context, ms, stack }) => {
              const ctx = context ? ` [${context}]` : '';
              const elapsed = ms ? ` ${ms}` : '';
              return `${timestamp} ${level}${ctx}: ${stack ?? message}${elapsed}`;
            }),
          );
        }

        return {
          level: logLevel,
          format: winston.format.combine(...formats),
          transports: [
            new winston.transports.Console(),
            ...(isProduction
              ? [
                  new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
                  new winston.transports.File({ filename: 'logs/combined.log' }),
                ]
              : []),
          ],
        };
      },
      inject: [ConfigService],
    }),
  ],
})
export class LoggerModule {}
