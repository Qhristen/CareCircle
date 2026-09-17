import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { CookieOptions, Request, Response } from 'express';
import { ApiContract } from '../../common/decorators/api-contract.decorator';
import { ConfigService } from '../config/config.service';
import { AuthService } from './auth.service';
import { LoginResponseDto, TokenResponseDto } from './dto/auth-responses.dto';
import {
  GoogleLoginDto,
  LoginDto,
  RefreshTokenDto,
  RegisterDto,
} from './dto/auth.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly config: ConfigService,
  ) {}

  @Post('register')
  @Throttle({ short: { limit: 5, ttl: 60000 } })
  @ApiContract({
    summary: 'Register an account',
    description:
      'Creates a user account and returns tokens for mobile clients or sets secure cookies for web clients.',
    response: {
      status: HttpStatus.CREATED,
      type: LoginResponseDto,
      description: 'The account and authenticated session were created.',
    },
  })
  async register(
    @Body() dto: RegisterDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.auth.register(
      dto,
      req.ip,
      req.headers['user-agent'],
    );
    return this.forPlatform(dto.platform, result, res);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ short: { limit: 10, ttl: 60000 } })
  @ApiContract({
    summary: 'Log in with email and password',
    description:
      'Authenticates credentials and returns tokens for mobile clients or sets secure cookies for web clients.',
    response: {
      status: HttpStatus.OK,
      type: LoginResponseDto,
      description: 'The authenticated session.',
    },
  })
  async login(
    @Body() dto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.auth.login(
      dto,
      req.ip,
      req.headers['user-agent'],
    );
    return this.forPlatform(dto.platform, result, res);
  }

  @Post('google')
  @HttpCode(HttpStatus.OK)
  @ApiContract({
    summary: 'Sign up or log in with Google',
    description:
      'Verifies a Google ID token, creates the user if needed, and starts an authenticated session.',
    response: {
      status: HttpStatus.OK,
      type: LoginResponseDto,
      description: 'The authenticated session.',
    },
  })
  async google(
    @Body() dto: GoogleLoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.auth.googleLogin(
      dto.idToken,
      req.ip,
      req.headers['user-agent'],
    );
    return this.forPlatform(dto.platform, result, res);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiContract({
    summary: 'Refresh an authenticated session',
    description:
      'Rotates a refresh token supplied in the request body or the web refresh-token cookie.',
    response: {
      status: HttpStatus.OK,
      type: TokenResponseDto,
      description:
        'Fresh session tokens, or expiry metadata for cookie sessions.',
    },
  })
  async refresh(
    @Body() dto: RefreshTokenDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const cookieToken = this.cookie(req, 'refresh_token');
    const token = dto.refreshToken || cookieToken;
    if (!token) throw new UnauthorizedException('No refresh token provided');
    const result = await this.auth.refresh(
      token,
      req.ip,
      req.headers['user-agent'],
    );
    if (cookieToken)
      this.setCookies(res, result.accessToken, result.refreshToken);
    return cookieToken ? { expiresIn: result.expiresIn } : result;
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiContract({
    summary: 'Log out',
    description:
      'Revokes the supplied refresh token when present and clears authentication cookies.',
    responseDescription: 'A confirmation that the session was closed.',
  })
  async logout(
    @Body() dto: RefreshTokenDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.auth.logout(
      dto.refreshToken || this.cookie(req, 'refresh_token'),
    );
    res.clearCookie('access_token', this.cookieOptions(0));
    res.clearCookie('refresh_token', this.cookieOptions(0));
    return { message: 'Logged out successfully' };
  }

  private forPlatform(
    platform: 'mobile' | 'web' | undefined,
    result: Awaited<ReturnType<AuthService['register']>>,
    res: Response,
  ) {
    if (platform === 'web') {
      this.setCookies(res, result.accessToken, result.refreshToken);
      return { user: result.user, expiresIn: result.expiresIn };
    }
    return result;
  }

  private setCookies(res: Response, accessToken: string, refreshToken: string) {
    res.cookie(
      'access_token',
      accessToken,
      this.cookieOptions(this.config.jwtAccessExpiry),
    );
    res.cookie(
      'refresh_token',
      refreshToken,
      this.cookieOptions(this.config.jwtRefreshExpiry),
    );
  }

  private cookieOptions(maxAgeSeconds: number): CookieOptions {
    return {
      httpOnly: true,
      secure: this.config.isProduction,
      sameSite: this.config.isProduction ? 'none' : 'lax',
      domain: this.config.cookieDomain || undefined,
      path: '/',
      maxAge: maxAgeSeconds * 1000,
    };
  }

  private cookie(req: Request, name: string): string | undefined {
    const cookies: unknown = req.cookies;
    if (!cookies || typeof cookies !== 'object') return undefined;
    const value = (cookies as Record<string, unknown>)[name];
    return typeof value === 'string' ? value : undefined;
  }
}
