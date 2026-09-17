import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const context = host.switchToHttp();
    const response = context.getResponse<Response>();
    const request = context.getRequest<Request>();
    const status: number =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;
    const content: unknown =
      exception instanceof HttpException
        ? exception.getResponse()
        : 'Internal server error';
    let message: unknown = content;
    if (content && typeof content === 'object')
      message = (content as { message?: unknown }).message ?? content;
    if (Array.isArray(message)) message = message[0];
    if (status === Number(HttpStatus.INTERNAL_SERVER_ERROR)) {
      this.logger.error(
        `${request.method} ${request.url} - Internal Server Error`,
        exception instanceof Error ? exception.stack : undefined,
      );
    }
    const details =
      content && typeof content === 'object' && !Array.isArray(content)
        ? (content as Record<string, unknown>)
        : {};
    response.status(status).json({
      ...details,
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message,
    });
  }
}
