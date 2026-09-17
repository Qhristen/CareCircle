import { Injectable } from '@nestjs/common';
import { ConfigService as NestConfigService } from '@nestjs/config';

@Injectable()
export class ConfigService {
  constructor(private readonly config: NestConfigService) {}
  get jwtSecret() {
    const value = this.config.get<string>('JWT_SECRET');
    if (!value) throw new Error('JWT_SECRET is required');
    return value;
  }
  get jwtAccessExpiry() {
    return Number(this.config.get('JWT_ACCESS_TOKEN_EXPIRY', 900));
  }
  get jwtRefreshExpiry() {
    return Number(this.config.get('JWT_REFRESH_TOKEN_EXPIRY', 604800));
  }
  get port() {
    return Number(this.config.get('PORT', 3000));
  }
  get isProduction() {
    return this.config.get('NODE_ENV', 'development') === 'production';
  }
  get cookieDomain() {
    return this.config.get<string>('COOKIE_DOMAIN') || undefined;
  }
  get frontendUrl() {
    return this.config.get<string>('FRONTEND_URL', 'http://localhost:3000');
  }
  get backendUrl() {
    return this.config.get<string>('BACKEND_URL', 'http://localhost:3000');
  }
  get corsOrigins() {
    return this.config
      .get<string>('CORS_ORIGINS', '*')
      .split(',')
      .map((value) => value.trim());
  }
  get googleConfig() {
    return {
      clientId: this.config.get<string>('GOOGLE_CLIENT_ID') || '',
      clientSecret: this.config.get<string>('GOOGLE_CLIENT_SECRET') || '',
      callbackUrl: this.config.get<string>('GOOGLE_CALLBACK_URL') || '',
    };
  }
  get paystackConfig() {
    return {
      secretKey: this.config.get<string>('PAYSTACK_SECRET_KEY') || '',
      publicKey: this.config.get<string>('PAYSTACK_PUBLIC_KEY') || '',
      baseUrl: this.config.get<string>(
        'PAYSTACK_BASE_URL',
        'https://api.paystack.co',
      ),
    };
  }
}
