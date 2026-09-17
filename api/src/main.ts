import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { DBExceptionFilter } from './common/filters/db-exception.filter';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { XssValidationPipe } from './common/pipes/xss-validation.pipe';
import { ConfigService } from './modules/config/config.service';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    rawBody: true,
  });
  const config = app.get(ConfigService);
  app.use(cookieParser());
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );
  app.enableCors({
    origin: (origin, callback) => {
      if (
        !origin ||
        config.corsOrigins.includes('*') ||
        origin.includes('localhost') ||
        config.corsOrigins.includes(origin)
      )
        return callback(null, true);
      callback(new Error('Origin is not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-API-Version',
      'X-Paystack-Signature',
      'If-Match',
      'Idempotency-Key',
    ],
  });
  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(
    new XssValidationPipe(),
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalFilters(new HttpExceptionFilter(), new DBExceptionFilter());
  app.enableShutdownHooks();

  const swaggerConfig = new DocumentBuilder()
    .setTitle('GiftCircle API')
    .setDescription('Community-powered collective gifting and support API')
    .setVersion('1.0')
    .addTag('giftcircle')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      'JWT-auth',
    )
    .addServer(
      config.isProduction
        ? config.backendUrl
        : `http://localhost:${config.port}/api/v1`,
    )
    .build();
  SwaggerModule.setup(
    'api/v1/docs',
    app,
    SwaggerModule.createDocument(app, swaggerConfig),
  );
  await app.listen(config.port);
  console.log(`GiftCircle API: http://localhost:${config.port}/api/v1`);
}

void bootstrap();
