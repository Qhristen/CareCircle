import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Circle } from '../../database/entities/Circle';
import { Contribution } from '../../database/entities/Contribution';
import { Invitation } from '../../database/entities/Invitation';
import { User } from '../../database/entities/User';
import { ConfigService } from '../config/config.service';
import { SocketGateway } from './socket.gateway';

@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([User, Circle, Invitation, Contribution]),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({ secret: config.jwtSecret }),
    }),
  ],
  providers: [SocketGateway],
  exports: [SocketGateway],
})
export class SocketModule {}
