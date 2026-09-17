import { ConfigService } from '../config/config.service';
import { PaystackClient } from './paystack.client';
import { PaymentService } from './payment.service';

describe('PaymentService', () => {
  it('delegates contribution initialization to Paystack', async () => {
    const initialized = {
      authorizationUrl: 'https://checkout.example/pay',
      accessCode: 'access',
      reference: 'GC_123',
    };
    const initialize = jest.fn().mockResolvedValue(initialized);
    const paystack = {
      initialize,
      configured: true,
    } as unknown as PaystackClient;
    const config = {
      paystackConfig: { publicKey: 'pk_test', secretKey: '', baseUrl: '' },
    } as ConfigService;
    const service = new PaymentService(paystack, config);
    const input = {
      email: 'member@example.com',
      amount: 5000,
      currency: 'NGN',
      reference: 'GC_123',
      callbackUrl: 'https://app.example/callback',
      metadata: { circleId: 'circle-id' },
    };

    await expect(service.initializeContribution(input)).resolves.toEqual(
      initialized,
    );
    expect(initialize).toHaveBeenCalledWith(input);
    expect(service.providers()).toEqual([
      { name: 'paystack', configured: true, publicKey: 'pk_test' },
    ]);
  });
});
