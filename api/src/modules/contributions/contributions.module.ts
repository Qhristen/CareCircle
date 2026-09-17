import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Circle } from '../../database/entities/Circle';
import { CircleActivity } from '../../database/entities/CircleActivity';
import { Contribution } from '../../database/entities/Contribution';
import { ContributionLedgerEntry } from '../../database/entities/ClientOperations';
import { GiftItem } from '../../database/entities/GiftItem';
import { Invitation } from '../../database/entities/Invitation';
import { Notification } from '../../database/entities/Notification';
import { ContributionsController } from './contributions.controller';
import { ContributionsService } from './contributions.service';
import { PaymentModule } from '../payment/payment.module';
import { SocketModule } from '../socket/socket.module';

@Module({
  imports: [
    forwardRef(() => PaymentModule),
    SocketModule,
    TypeOrmModule.forFeature([
      Circle,
      GiftItem,
      Contribution,
      Invitation,
      CircleActivity,
      Notification,
      ContributionLedgerEntry,
    ]),
  ],
  controllers: [ContributionsController],
  providers: [ContributionsService],
  exports: [ContributionsService],
})
export class ContributionsModule {}
