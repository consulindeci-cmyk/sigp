import 'tsconfig-paths/register';
import { NestFactory } from '@nestjs/core';
import { VersioningType, ValidationPipe } from '@nestjs/common';
import { ExpressAdapter } from '@nestjs/platform-express';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import helmet from 'helmet';
import express from 'express';
import { AppModule } from '../src/app.module';
import { HttpExceptionFilter } from '../src/common/exceptions/http-exception.filter';
import { ResponseInterceptor } from '../src/common/interceptors/response.interceptor';
import { LoggingInterceptor } from '../src/common/interceptors/logging.interceptor';

const server = express();
let appPromise: Promise<any> | null = null;

async function bootstrap() {
  if (appPromise) {
    return appPromise;
  }

  appPromise = (async () => {
    const app = await NestFactory.create(
      AppModule,
      new ExpressAdapter(server),
      { bufferLogs: true }
    );

    const config = app.get(ConfigService);
    const prefix = config.get<string>('API_PREFIX', 'api');

    // Winston logger
    app.useLogger(app.get(WINSTON_MODULE_NEST_PROVIDER));

    // Security
    app.use(helmet());
    app.enableCors({
      origin: ['http://localhost:5173', 'https://sigp-frontend-delta.vercel.app', '*'],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    });

    // Global prefix & URI versioning — /api/v1/...
    app.setGlobalPrefix(prefix);
    app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });

    // Global pipes
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    );

    // Global filters & interceptors
    app.useGlobalFilters(new HttpExceptionFilter());
    app.useGlobalInterceptors(new ResponseInterceptor(), new LoggingInterceptor());

    // Swagger
    const swaggerConfig = new DocumentBuilder()
      .setTitle('SIGP ERP API')
      .setDescription('Backend V2 — Système Intégré de Gestion de Projets')
      .setVersion('2.0')
      .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'access-token')
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup(`${prefix}/docs`, app, document, {
      swaggerOptions: { persistAuthorization: true },
    });

    await app.init();
    return app;
  })();

  return appPromise;
}

export default async (req: express.Request, res: express.Response) => {
  await bootstrap();
  server(req, res);
};
