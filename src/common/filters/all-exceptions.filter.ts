import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';

import { AppException } from '../exceptions';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    const request = context.getRequest<Request>();
    const response = context.getResponse<Response>();

    const requestId = request.header('x-request-id');
    const path = request.originalUrl ?? request.url;

    if (exception instanceof AppException) {
      const status = this.getStatus(exception.code);

      response.status(status).json({
        statusCode: status,
        code: exception.code,
        message: exception.message,
        ...(exception.details !== undefined && {
          details: exception.details,
        }),
        requestId,
        timestamp: new Date().toISOString(),
        path,
      });

      return;
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      const message =
        typeof exceptionResponse === 'string'
          ? exceptionResponse
          : ((exceptionResponse as { message?: unknown }).message ??
            'Request failed');

      response.status(status).json({
        statusCode: status,
        code: this.getHttpErrorCode(status),
        message,
        requestId,
        timestamp: new Date().toISOString(),
        path,
      });

      return;
    }

    this.logger.error(
      `Unhandled exception requestId=${requestId ?? 'unknown'}`,
      exception instanceof Error ? exception.stack : String(exception),
    );

    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
      requestId,
      timestamp: new Date().toISOString(),
      path,
    });
  }

  private getStatus(code: string): number {
    switch (code) {
      case 'NOT_FOUND':
        return HttpStatus.NOT_FOUND;

      case 'CONFLICT':
        return HttpStatus.CONFLICT;

      case 'VALIDATION_ERROR':
        return HttpStatus.BAD_REQUEST;

      default:
        return HttpStatus.INTERNAL_SERVER_ERROR;
    }
  }

  private getHttpErrorCode(status: number): string {
    switch (status) {
      case HttpStatus.BAD_REQUEST:
        return 'BAD_REQUEST';

      case HttpStatus.UNAUTHORIZED:
        return 'UNAUTHORIZED';

      case HttpStatus.FORBIDDEN:
        return 'FORBIDDEN';

      case HttpStatus.NOT_FOUND:
        return 'NOT_FOUND';

      case HttpStatus.CONFLICT:
        return 'CONFLICT';

      case HttpStatus.TOO_MANY_REQUESTS:
        return 'TOO_MANY_REQUESTS';

      default:
        return status >= 500 ? 'INTERNAL_SERVER_ERROR' : 'HTTP_ERROR';
    }
  }
}
