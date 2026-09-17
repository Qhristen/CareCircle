import {
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
  RawBodyRequest,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiBody, ApiHeader, ApiTags } from '@nestjs/swagger';
import { ApiContract } from '../../common/decorators/api-contract.decorator';
import { Request } from 'express';
import { ContributionsService } from '../contributions/contributions.service';
import { PaymentVerification } from './paystack.client';
import { PaymentService } from './payment.service';

@ApiTags('webhooks')
@Controller('webhooks')
export class WebhookController {
  constructor(
    private readonly payments: PaymentService,
    private readonly contributions: ContributionsService,
  ) {}

  @Post('paystack')
  @HttpCode(HttpStatus.OK)
  @ApiHeader({
    name: 'x-paystack-signature',
    required: true,
    description:
      'Paystack HMAC-SHA512 signature for the exact raw request body.',
  })
  @ApiBody({
    description: 'The unmodified Paystack webhook event JSON.',
    schema: {
      type: 'object',
      required: ['event', 'data'],
      properties: {
        event: { type: 'string', example: 'charge.success' },
        data: { type: 'object', additionalProperties: true },
      },
    },
  })
  @ApiContract({
    summary: 'Receive a Paystack webhook',
    description:
      'Verifies the raw-body signature and applies supported Paystack payment events idempotently.',
    responseDescription: 'The webhook processing acknowledgement.',
  })
  handlePaystack(
    @Req() request: RawBodyRequest<Request>,
    @Headers('x-paystack-signature') signature?: string,
  ) {
    if (
      !request.rawBody ||
      !this.payments.verifyPaystackWebhook(request.rawBody, signature)
    ) {
      throw new UnauthorizedException('Invalid Paystack signature');
    }
    return this.contributions.handlePaystackEvent(
      request.body as { event?: string; data?: PaymentVerification },
    );
  }
}
