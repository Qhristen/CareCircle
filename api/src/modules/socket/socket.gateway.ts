import 'dotenv/config';
import {
  Logger,
  UnauthorizedException,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsException,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Repository } from 'typeorm';
import { Circle } from '../../database/entities/Circle';
import { Contribution } from '../../database/entities/Contribution';
import { Invitation } from '../../database/entities/Invitation';
import { User } from '../../database/entities/User';
import {
  CirclePrivacy,
  CircleStatus,
  ContributionStatus,
  InvitationStatus,
  UserRole,
} from '../../database/enums';
import { ConfigService } from '../config/config.service';
import { JoinCircleRoomDto, LeaveCircleRoomDto } from './dto/circle-socket.dto';

interface SocketUser {
  id: string;
  email: string;
  role: UserRole;
}
interface SocketJwtPayload {
  sub: string;
  email: string;
  role: UserRole;
}
interface SocketData {
  user?: SocketUser;
}
type CareCircleSocket = Socket<
  Record<string, never>,
  Record<string, never>,
  Record<string, never>,
  SocketData
>;

const configuredOrigins = process.env.CORS_ORIGINS?.split(',').map((origin) =>
  origin.trim(),
);

@WebSocketGateway({
  namespace: 'circles',
  cors: {
    origin: configuredOrigins?.includes('*')
      ? true
      : (configuredOrigins ?? [
          'http://localhost:3000',
          'http://localhost:5173',
        ]),
    credentials: true,
  },
})
export class SocketGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() server: Server;
  private readonly logger = new Logger(SocketGateway.name);

  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(Circle) private readonly circles: Repository<Circle>,
    @InjectRepository(Invitation)
    private readonly invitations: Repository<Invitation>,
    @InjectRepository(Contribution)
    private readonly contributions: Repository<Contribution>,
  ) {}

  afterInit() {
    this.logger.log('CareCircle socket gateway initialized');
  }

  async handleConnection(client: CareCircleSocket) {
    try {
      const token = this.extractToken(client);
      if (!token) throw new UnauthorizedException('No access token provided');
      const payload = await this.jwt.verifyAsync<SocketJwtPayload>(token, {
        secret: this.config.jwtSecret,
      });
      const user = await this.users.findOne({ where: { id: payload.sub } });
      if (!user || user.deletedAt || user.isSuspended)
        throw new UnauthorizedException('Account is unavailable');
      client.data.user = { id: user.id, email: user.email, role: user.role };
      await client.join(this.userRoom(user.id));
    } catch (error: unknown) {
      this.logger.warn(
        `Socket connection rejected: ${error instanceof Error ? error.message : 'invalid credentials'}`,
      );
      client.disconnect(true);
    }
  }

  handleDisconnect(client: CareCircleSocket) {
    if (client.data.user)
      this.logger.debug(`Socket disconnected for user ${client.data.user.id}`);
  }

  @SubscribeMessage('circle:join')
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  async joinCircle(
    @ConnectedSocket() client: CareCircleSocket,
    @MessageBody() dto: JoinCircleRoomDto,
  ) {
    const user = this.requireUser(client);
    if (!(await this.canAccess(dto.circleId, user, dto.invitationCode)))
      throw new WsException('You cannot join this circle room');
    await client.join(this.circleRoom(dto.circleId));
    return { event: 'circle:joined', circleId: dto.circleId };
  }

  @SubscribeMessage('circle:leave')
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  async leaveCircle(
    @ConnectedSocket() client: CareCircleSocket,
    @MessageBody() dto: LeaveCircleRoomDto,
  ) {
    await client.leave(this.circleRoom(dto.circleId));
    return { event: 'circle:left', circleId: dto.circleId };
  }

  emitCircleUpdated(circleId: string, payload: unknown) {
    this.server?.to(this.circleRoom(circleId)).emit('circle:updated', payload);
  }
  emitContributionReceived(circleId: string, payload: unknown) {
    this.server
      ?.to(this.circleRoom(circleId))
      .emit('contribution:received', payload);
  }
  emitFulfillmentUpdated(circleId: string, payload: unknown) {
    this.server
      ?.to(this.circleRoom(circleId))
      .emit('fulfillment:updated', payload);
  }
  emitNotification(userId: string, payload: unknown) {
    this.server?.to(this.userRoom(userId)).emit('notification:new', payload);
  }

  private extractToken(client: CareCircleSocket) {
    const auth: unknown = client.handshake.auth;
    const authToken =
      auth && typeof auth === 'object'
        ? (auth as { token?: unknown }).token
        : undefined;
    if (typeof authToken === 'string') return authToken;
    const authorization = client.handshake.headers.authorization;
    return typeof authorization === 'string' &&
      authorization.startsWith('Bearer ')
      ? authorization.slice(7)
      : undefined;
  }

  private requireUser(client: CareCircleSocket) {
    if (!client.data.user) throw new WsException('Authentication required');
    return client.data.user;
  }

  private async canAccess(
    circleId: string,
    user: SocketUser,
    invitationCode?: string,
  ) {
    const circle = await this.circles.findOne({ where: { id: circleId } });
    if (!circle) return false;
    if (circle.organizerId === user.id || user.role === UserRole.ADMIN)
      return true;
    if (circle.isHidden) return false;
    if ([CircleStatus.DRAFT, CircleStatus.CANCELLED].includes(circle.status))
      return false;
    if (circle.privacy !== CirclePrivacy.PRIVATE) return true;
    if (
      await this.contributions.exists({
        where: {
          circleId,
          contributorId: user.id,
          status: ContributionStatus.SUCCESS,
        },
      })
    )
      return true;
    if (
      await this.invitations.exists({
        where: {
          circleId,
          acceptedById: user.id,
          status: InvitationStatus.ACCEPTED,
        },
      })
    )
      return true;
    if (!invitationCode) return false;
    const invite = await this.invitations.findOne({
      where: { circleId, code: invitationCode },
    });
    return Boolean(
      invite &&
      invite.expiresAt > new Date() &&
      ![InvitationStatus.DECLINED, InvitationStatus.EXPIRED].includes(
        invite.status,
      ),
    );
  }

  private circleRoom(circleId: string) {
    return `circle:${circleId}`;
  }
  private userRoom(userId: string) {
    return `user:${userId}`;
  }
}
