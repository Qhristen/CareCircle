import { HttpModule } from '@nestjs/axios';
import { forwardRef, Module } from '@nestjs/common';
import { ContributionsModule } from '../contributions/contributions.module';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { PaystackClient } from './paystack.client';
import { WebhookController } from './webhook.controller';

@Module({
  imports: [
    HttpModule.register({ timeout: 30000, maxRedirects: 3 }),
    forwardRef(() => ContributionsModule),
  ],
  controllers: [PaymentController, WebhookController],
  providers: [PaystackClient, PaymentService],
  exports: [PaymentService],
})
export class PaymentModule {}
