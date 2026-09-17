import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Circle } from '../../database/entities/Circle';
import { CircleUpdate } from '../../database/entities/CircleUpdate';
import { Contribution } from '../../database/entities/Contribution';
import { ModerationReport } from '../../database/entities/ModerationReport';
import { Token } from '../../database/entities/Token';
import { User } from '../../database/entities/User';
import { NotificationModule } from '../notification/notification.module';
import { SocketModule } from '../socket/socket.module';
import { ModerationController } from './moderation.controller';
import { ModerationService } from './moderation.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ModerationReport,
      User,
      Token,
      Circle,
      CircleUpdate,
      Contribution,
    ]),
    NotificationModule,
    SocketModule,
  ],
  controllers: [ModerationController],
  providers: [ModerationService],
})
export class ModerationModule {}
