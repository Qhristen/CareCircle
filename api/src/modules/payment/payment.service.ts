import { Injectable } from '@nestjs/common';
import { ConfigService } from '../config/config.service';
import {
  PaystackClient,
  PaymentInitialization,
  PaymentVerification,
} from './paystack.client';

@Injectable()
export class PaymentService {
  constructor(
    private readonly paystack: PaystackClient,
    private readonly config: ConfigService,
  ) {}

  initializeContribution(input: {
    email: string;
    amount: number;
    currency: string;
    reference: string;
    callbackUrl: string;
    metadata: Record<string, unknown>;
  }): Promise<PaymentInitialization> {
    return this.paystack.initialize(input);
  }

  verifyContribution(reference: string): Promise<PaymentVerification> {
    return this.paystack.verify(reference);
  }

  verifyPaystackWebhook(rawBody: Buffer, signature?: string) {
    return this.paystack.verifyWebhookSignature(rawBody, signature);
  }

  providers() {
    return [
      {
        name: 'paystack',
        configured: this.paystack.configured,
        publicKey: this.config.paystackConfig.publicKey,
      },
    ];
  }
}
