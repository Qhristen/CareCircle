import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ApiContract } from '../../common/decorators/api-contract.decorator';
import { PaymentService } from './payment.service';

@ApiTags('payments')
@Controller('payments')
export class PaymentController {
  constructor(private readonly payments: PaymentService) {}

  @Get('providers')
  @ApiContract({
    summary: 'List payment providers',
    description:
      'Returns enabled payment providers and the payment methods each provider supports.',
    response: {
      status: 200,
      description: 'The enabled payment providers.',
      schema: { type: 'array', items: { type: 'object' } },
    },
  })
  providers() {
    return this.payments.providers();
  }
}
