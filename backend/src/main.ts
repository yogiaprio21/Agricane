import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import * as compression from 'compression';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule, {
    logger: ['log', 'error', 'warn', 'debug', 'verbose'],
  });

  const configService = app.get(ConfigService);
  const port = configService.get<number>('port');
  const apiPrefix = configService.get<string>('apiPrefix');

  // Security & Performance Middleware
  app.use(helmet());
  const compressionMiddleware =
    typeof (compression as any).default === 'function'
      ? (compression as any).default()
      : (compression as any)();
  app.use(compressionMiddleware);

  app.use((req: any, res: any, next: () => void) => {
    if ((req.method === 'GET' || req.method === 'HEAD') && req.path === '/') {
      if (req.method === 'HEAD') {
        return res.status(200).end();
      }

      return res.status(200).json({
        status: 'ok',
        service: 'AgriCane Intelligence Platform API',
        health: `/${apiPrefix}/health`,
      });
    }

    return next();
  });

  app.setGlobalPrefix(apiPrefix);

  app.enableCors({
    origin: configService.get<string[]>('cors.origin'),
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      disableErrorMessages:
        configService.get<string>('environment') === 'production',
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  if (configService.get<boolean>('swagger.enabled')) {
    const config = new DocumentBuilder()
      .setTitle('AgriCane Intelligence Platform API')
      .setDescription(
        'Enterprise-scale sugarcane plantation management system with real-time monitoring, AI decision support, and external API integrations',
      )
      .setVersion('1.0')
      .addTag('Authentication', 'User authentication and authorization endpoints')
      .addTag('Users', 'User management endpoints')
      .addTag('Fields', 'Plantation field management')
      .addTag('Environmental Data', 'Weather and climate data from OpenWeatherMap')
      .addTag('Agronomy & FAO Data', 'Agronomic reference data and recommendations')
      .addTag('IoT Sensors', 'Soil sensor readings and real-time monitoring')
      .addTag('Monitoring (NDVI & Drone)', 'Satellite NDVI and drone flight management')
      .addTag('AI Decision Support', 'AI-powered agricultural recommendations')
      .addTag('Notifications', 'System notifications and alerts')
      .addBearerAuth()
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document, {
      swaggerOptions: {
        persistAuthorization: true,
        tagsSorter: 'alpha',
        operationsSorter: 'alpha',
      },
    });
  }

  await app.listen(port, '0.0.0.0');

  logger.log(`🚀 AgriCane Platform is running on: http://localhost:${port}/${apiPrefix}`);
  if (configService.get<boolean>('swagger.enabled')) {
    logger.log(`📚 Swagger documentation: http://localhost:${port}/api/docs`);
  }
  logger.log(`🔌 WebSocket IoT gateway: ws://localhost:${port}/iot`);
  logger.log(`✅ Environment: ${configService.get<string>('environment')}`);
}

bootstrap();
