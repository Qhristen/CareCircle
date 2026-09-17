import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Circle } from '../../database/entities/Circle';
import { CircleActivity } from '../../database/entities/CircleActivity';
import { CircleUpdate } from '../../database/entities/CircleUpdate';
import { Contribution } from '../../database/entities/Contribution';
import { Fulfillment } from '../../database/entities/Fulfillment';
import { GiftItem } from '../../database/entities/GiftItem';
import { Invitation } from '../../database/entities/Invitation';
import {
  CircleBroadcast,
  CircleMembership,
  CircleMessage,
  DeliveryAddressRecord,
  PurchaseOrder,
} from '../../database/entities/ClientOperations';
import { NotificationModule } from '../notification/notification.module';
import { SocketModule } from '../socket/socket.module';
import { CirclesController } from './circles.controller';
import { CirclesService } from './circles.service';
import { InvitationsController } from './invitations.controller';
import {
  CircleMessagesController,
  ClientInvitationsController,
  OrganizerController,
} from './client-operations.controller';
import { ClientOperationsService } from './client-operations.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Circle,
      GiftItem,
      Contribution,
      Invitation,
      CircleUpdate,
      CircleActivity,
      Fulfillment,
      CircleMessage,
      CircleBroadcast,
      PurchaseOrder,
      CircleMembership,
      DeliveryAddressRecord,
    ]),
    NotificationModule,
    SocketModule,
  ],
  controllers: [
    CirclesController,
    InvitationsController,
    CircleMessagesController,
    OrganizerController,
    ClientInvitationsController,
  ],
  providers: [CirclesService, ClientOperationsService],
  exports: [CirclesService],
})
export class CirclesModule {}
