import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import * as cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const isProduction = configService.get<string>('nodeEnv') === 'production';
  const port = configService.get<number>('port') || 3000;

  // Sécurité HTTP headers
  app.use(helmet());
  app.use(cookieParser());

  // Validation globale
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // CORS sécurisé avec credentials
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  app.enableCors({
    origin: isProduction ? [frontendUrl] : ['http://localhost:5173', frontendUrl],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // Swagger — DÉSACTIVÉ en production
  if (!isProduction) {
    const config = new DocumentBuilder()
      .setTitle('SIGP API')
      .setDescription("Backend du Système d'Information de Gestion de Projets de Développement")
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);
  }

  // Écouter sur 0.0.0.0 pour être accessible depuis Docker
  await app.listen(port, '0.0.0.0');
  console.log(`🚀 Application running on: http://localhost:${port}`);
  if (!isProduction) {
    console.log(`📚 Swagger documentation: http://localhost:${port}/api/docs`);
  } else {
    console.log(`🔒 Mode production — Swagger désactivé`);
  }
}
bootstrap();
// Trigger restart
