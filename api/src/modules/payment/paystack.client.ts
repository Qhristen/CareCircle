import { HttpService } from '@nestjs/axios';
import {
  BadGatewayException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { createHmac, timingSafeEqual } from 'crypto';
import { firstValueFrom } from 'rxjs';
import { ConfigService } from '../config/config.service';

export interface PaymentVerification {
  status: string;
  reference: string;
  amount: number;
  currency: string;
  paid_at?: string;
  customer?: { email?: string };
  metadata?: Record<string, unknown>;
}

export interface PaymentInitialization {
  authorizationUrl: string;
  accessCode: string;
  reference: string;
}

interface PaystackResponse<T> {
  status: boolean;
  message?: string;
  data?: T;
}
interface PaystackInitializationData {
  authorization_url: string;
  access_code: string;
  reference: string;
}

@Injectable()
export class PaystackClient {
  constructor(
    private readonly http: HttpService,
    private readonly config: ConfigService,
  ) {}

  get configured() {
    return Boolean(this.config.paystackConfig.secretKey);
  }

  private get secretKey() {
    const key = this.config.paystackConfig.secretKey;
    if (!key)
      throw new ServiceUnavailableException('Paystack is not configured');
    return key;
  }

  private get baseUrl() {
    return this.config.paystackConfig.baseUrl || 'https://api.paystack.co';
  }
  private headers() {
    return {
      Authorization: `Bearer ${this.secretKey}`,
      'Content-Type': 'application/json',
    };
  }

  async initialize(input: {
    email: string;
    amount: number;
    currency: string;
    reference: string;
    callbackUrl: string;
    metadata: Record<string, unknown>;
  }): Promise<PaymentInitialization> {
    try {
      const response = await firstValueFrom(
        this.http.post<PaystackResponse<PaystackInitializationData>>(
          `${this.baseUrl}/transaction/initialize`,
          {
            email: input.email,
            amount: Math.round(input.amount * 100),
            currency: input.currency,
            reference: input.reference,
            callback_url: input.callbackUrl,
            metadata: input.metadata,
            channels: ['card', 'bank', 'ussd', 'bank_transfer'],
          },
          { headers: this.headers() },
        ),
      );
      const data = response.data.data;
      if (!response.data.status || !data?.authorization_url)
        throw new Error(response.data.message || 'Initialization failed');
      return {
        authorizationUrl: data.authorization_url,
        accessCode: data.access_code,
        reference: data.reference,
      };
    } catch (error: unknown) {
      if (error instanceof ServiceUnavailableException) throw error;
      throw new BadGatewayException(
        `Could not initialize payment: ${error instanceof Error ? error.message : 'Unknown payment error'}`,
      );
    }
  }

  async verify(reference: string): Promise<PaymentVerification> {
    try {
      const response = await firstValueFrom(
        this.http.get<PaystackResponse<PaymentVerification>>(
          `${this.baseUrl}/transaction/verify/${encodeURIComponent(reference)}`,
          { headers: this.headers() },
        ),
      );
      if (!response.data.status || !response.data.data)
        throw new Error(response.data.message || 'Verification failed');
      return response.data.data;
    } catch (error: unknown) {
      if (error instanceof ServiceUnavailableException) throw error;
      throw new BadGatewayException(
        `Could not verify payment: ${error instanceof Error ? error.message : 'Unknown payment error'}`,
      );
    }
  }

  verifyWebhookSignature(rawBody: Buffer, signature?: string) {
    if (!signature) return false;
    const digest = createHmac('sha512', this.secretKey)
      .update(rawBody)
      .digest('hex');
    const expected = Buffer.from(digest);
    const actual = Buffer.from(signature);
    return (
      expected.length === actual.length && timingSafeEqual(expected, actual)
    );
  }
}
