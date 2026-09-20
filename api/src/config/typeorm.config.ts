import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import {
  Category,
  CatalogItem,
  Circle,
  CircleActivity,
  CircleBroadcast,
  CircleMembership,
  CircleMessage,
  CircleUpdate,
  Contribution,
  ContributionLedgerEntry,
  DeliveryAddressRecord,
  Fulfillment,
  GiftItem,
  Invitation,
  ModerationReport,
  Notification,
  PurchaseOrder,
  Token,
  User,
} from '../database/entities';

export const CareCircleEntities = [
  User,
  Token,
  Category,
  Circle,
  GiftItem,
  Contribution,
  Invitation,
  CircleUpdate,
  CircleActivity,
  Fulfillment,
  Notification,
  ModerationReport,
  ContributionLedgerEntry,
  CircleMessage,
  CircleBroadcast,
  PurchaseOrder,
  CircleMembership,
  DeliveryAddressRecord,
  CatalogItem,
];

export const typeOrmConfig = (config: ConfigService): TypeOrmModuleOptions => ({
  type: 'postgres',
  ...(config.get<string>('DATABASE_URL')
    ? { url: config.get<string>('DATABASE_URL') }
    : {
        host: config.get<string>('DB_HOST'),
        port: config.get<number>('DB_PORT'),
        username: config.get<string>('DB_USERNAME'),
        password: config.get<string>('DB_PASSWORD'),
        database: config.get<string>('DB_NAME'),
      }),
  entities: CareCircleEntities,
  migrations: [__dirname + '/../database/migrations/*{.ts,.js}'],
  synchronize: false,
  logging: config.get<string>('NODE_ENV') === 'development',
  ssl:
    config.get<string>('NODE_ENV') === 'production'
      ? { rejectUnauthorized: false }
      : false,
  extra: { max: 20, idleTimeoutMillis: 30000, connectionTimeoutMillis: 5000 },
});
