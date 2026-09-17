import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiResponseOptions } from '@nestjs/swagger';

interface ApiContractOptions {
  summary: string;
  description: string;
  status?: number;
  responseDescription?: string;
  response?: ApiResponseOptions;
}

/**
 * Keeps every operation useful in generated API clients: a summary, a full
 * description, and an explicit successful response are always present.
 */
export function ApiContract(options: ApiContractOptions) {
  const status = options.status ?? HttpStatus.OK;
  const response =
    options.response ??
    (status === 204
      ? {
          status,
          description:
            options.responseDescription ??
            'The request completed successfully.',
        }
      : {
          status,
          description:
            options.responseDescription ??
            'The request completed successfully.',
          schema: { type: 'object', additionalProperties: true },
        });

  return applyDecorators(
    ApiOperation({
      summary: options.summary,
      description: options.description,
    }),
    ApiResponse(response),
  );
}
