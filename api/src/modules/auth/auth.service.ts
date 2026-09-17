import {
  ConflictException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { OAuth2Client } from 'google-auth-library';
import { compare, hash } from 'bcryptjs';
import { randomUUID } from 'crypto';
import { Repository } from 'typeorm';
import { Token } from '../../database/entities/Token';
import { User } from '../../database/entities/User';
import { TokenType } from '../../database/enums';
import { ConfigService } from '../config/config.service';
import { LoginDto, RegisterDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly googleClient: OAuth2Client;

  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(Token) private readonly tokens: Repository<Token>,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {
    this.googleClient = new OAuth2Client(this.config.googleConfig.clientId);
  }

  async register(dto: RegisterDto, ipAddress?: string, userAgent?: string) {
    const email = dto.email.trim().toLowerCase();
    if (await this.users.exists({ where: { email } }))
      throw new ConflictException('An account with this email already exists');
    const user = await this.users.save(
      this.users.create({
        name: dto.name.trim(),
        email,
        passwordHash: await hash(dto.password, 12),
        googleId: null,
        avatarUrl: null,
        phone: null,
      }),
    );
    return this.createSession(user, ipAddress, userAgent);
  }

  async login(dto: LoginDto, ipAddress?: string, userAgent?: string) {
    const user = await this.users
      .createQueryBuilder('user')
      .addSelect('user.passwordHash')
      .where('LOWER(user.email) = :email', {
        email: dto.email.trim().toLowerCase(),
      })
      .getOne();
    if (
      !user?.passwordHash ||
      !(await compare(dto.password, user.passwordHash))
    ) {
      throw new UnauthorizedException('Invalid email or password');
    }
    return this.createSession(user, ipAddress, userAgent);
  }

  async googleLogin(idToken: string, ipAddress?: string, userAgent?: string) {
    if (!this.config.googleConfig.clientId)
      throw new UnauthorizedException('Google sign-in is not configured');
    try {
      const ticket = await this.googleClient.verifyIdToken({
        idToken,
        audience: this.config.googleConfig.clientId,
      });
      const payload = ticket.getPayload();
      if (!payload?.sub || !payload.email)
        throw new UnauthorizedException('Invalid Google token');
      const email = payload.email.toLowerCase();
      let user = await this.users.findOne({
        where: [{ googleId: payload.sub }, { email }],
      });
      if (!user) {
        user = this.users.create({
          googleId: payload.sub,
          email,
          name: payload.name || email.split('@')[0],
          avatarUrl: payload.picture ?? null,
          passwordHash: null,
          phone: null,
        });
      } else {
        user.googleId = payload.sub;
        if (payload.picture) user.avatarUrl = payload.picture;
      }
      user = await this.users.save(user);
      return this.createSession(user, ipAddress, userAgent);
    } catch (error: unknown) {
      this.logger.warn(
        error instanceof Error ? error.message : 'Google authentication failed',
      );
      throw new UnauthorizedException('Google authentication failed');
    }
  }

  async refresh(refreshToken: string, ipAddress?: string, userAgent?: string) {
    const record = await this.tokens.findOne({
      where: { token: refreshToken, type: TokenType.REFRESH_TOKEN },
      relations: { user: true },
    });
    if (
      !record ||
      record.expiresAt <= new Date() ||
      record.user.deletedAt ||
      record.user.isSuspended
    ) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
    try {
      await this.jwt.verifyAsync(refreshToken, {
        secret: this.config.jwtSecret,
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
    await this.tokens.remove(record);
    const session = await this.createSession(record.user, ipAddress, userAgent);
    return {
      accessToken: session.accessToken,
      refreshToken: session.refreshToken,
      expiresIn: session.expiresIn,
    };
  }

  async logout(refreshToken?: string) {
    if (refreshToken)
      await this.tokens.delete({
        token: refreshToken,
        type: TokenType.REFRESH_TOKEN,
      });
    return { message: 'Logged out successfully' };
  }

  private async createSession(
    user: User,
    ipAddress?: string,
    userAgent?: string,
  ) {
    if (user.deletedAt || user.isSuspended)
      throw new UnauthorizedException('This account is unavailable');
    const payload = { sub: user.id, email: user.email, role: user.role };
    const accessToken = await this.jwt.signAsync(payload, {
      secret: this.config.jwtSecret,
      expiresIn: `${this.config.jwtAccessExpiry}s`,
    });
    const refreshToken = await this.jwt.signAsync(
      { ...payload, jti: randomUUID() },
      {
        secret: this.config.jwtSecret,
        expiresIn: `${this.config.jwtRefreshExpiry}s`,
      },
    );
    await this.tokens.save(
      this.tokens.create({
        userId: user.id,
        token: refreshToken,
        type: TokenType.REFRESH_TOKEN,
        expiresAt: new Date(Date.now() + this.config.jwtRefreshExpiry * 1000),
        ipAddress: ipAddress ?? null,
        userAgent: userAgent ?? null,
        usedAt: null,
      }),
    );
    const result = {
      accessToken,
      refreshToken,
      expiresIn: this.config.jwtAccessExpiry,
    };
    return { user: this.safeUser(user), ...result };
  }

  private safeUser(user: User) {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      avatarUrl: user.avatarUrl,
      phone: user.phone,
      country: user.country,
      currency: user.currency,
      role: user.role,
    };
  }
}
