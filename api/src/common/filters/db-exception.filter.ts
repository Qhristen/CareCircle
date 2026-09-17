import { ArgumentsHost, Catch, HttpStatus, Logger } from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import { Response } from 'express';
import { QueryFailedError } from 'typeorm';

@Catch(QueryFailedError)
export class DBExceptionFilter extends BaseExceptionFilter {
  private readonly logger = new Logger(DBExceptionFilter.name);

  catch(exception: QueryFailedError, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();
    const driverError: unknown = exception.driverError;
    const rawCode =
      driverError && typeof driverError === 'object'
        ? (driverError as { code?: unknown }).code
        : undefined;
    const code = typeof rawCode === 'string' ? rawCode : undefined;
    let status: number = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Database error';
    if (code === '23505') {
      status = HttpStatus.CONFLICT;
      message = 'This record already exists';
    } else if (code === '23503') {
      status = HttpStatus.BAD_REQUEST;
      message = 'A related record does not exist';
    } else if (code === '23502') {
      status = HttpStatus.BAD_REQUEST;
      message = 'A required field is missing';
    }
    this.logger.error(
      `Database error ${code ?? 'unknown'}: ${exception.message}`,
      exception.stack,
    );
    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      message,
      errorCode: code,
    });
  }
}
