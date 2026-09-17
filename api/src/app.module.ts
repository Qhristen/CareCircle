import { Module } from '@nestjs/common';
import {
  ConfigModule as NestConfigModule,
  ConfigService as NestConfigService,
} from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { envValidationSchema } from './config/env.validation';
import { typeOrmConfig } from './config/typeorm.config';
import { AuthModule } from './modules/auth/auth.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { CirclesModule } from './modules/circles/circles.module';
import { ConfigModule } from './modules/config/config.module';
import { ContributionsModule } from './modules/contributions/contributions.module';
import { NotificationModule } from './modules/notification/notification.module';
import { ModerationModule } from './modules/moderation/moderation.module';
import { PaymentModule } from './modules/payment/payment.module';
import { SocketModule } from './modules/socket/socket.module';
import { UserModule } from './modules/user/user.module';
import { SupportingModule } from './modules/supporting/supporting.module';

@Module({
  imports: [
    NestConfigModule.forRoot({
      isGlobal: true,
      validationSchema: envValidationSchema,
      envFilePath: ['.env.local', '.env'],
    }),
    TypeOrmModule.forRootAsync({
      imports: [NestConfigModule],
      useFactory: typeOrmConfig,
      inject: [NestConfigService],
    }),
    ThrottlerModule.forRoot([
      { name: 'short', ttl: 60000, limit: 20 },
      { name: 'default', ttl: 60000, limit: 100 },
    ]),
    ConfigModule,
    AuthModule,
    CategoriesModule,
    UserModule,
    CirclesModule,
    ContributionsModule,
    PaymentModule,
    NotificationModule,
    ModerationModule,
    SocketModule,
    SupportingModule,
  ],
  controllers: [AppController],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
