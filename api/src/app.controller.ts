import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ApiContract } from './common/decorators/api-contract.decorator';

@ApiTags('health')
@Controller()
export class AppController {
  @Get()
  @ApiContract({
    summary: 'Check API health',
    description:
      'Returns service identity, version, current server timestamp, and a healthy status.',
    response: {
      status: 200,
      description: 'The API is healthy.',
      schema: {
        type: 'object',
        required: ['status', 'service', 'version', 'timestamp'],
        properties: {
          status: { type: 'string', example: 'ok' },
          service: { type: 'string', example: 'GiftCircle API' },
          version: { type: 'string', example: '1.0.0' },
          timestamp: { type: 'string', format: 'date-time' },
        },
      },
    },
  })
  health() {
    return {
      status: 'ok',
      service: 'GiftCircle API',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
    };
  }
}
