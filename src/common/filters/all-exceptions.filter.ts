import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import {
  GqlArgumentsHost,
  GqlContextType,
  GqlExceptionFilter,
} from '@nestjs/graphql';
import type { Request, Response } from 'express';

import { AppException } from '../exceptions';
import { DatabaseExceptionMapper } from '../mappers/database-exception.mapper';

interface GraphQLRequestContext {
  requestId?: string;
}

@Catch()
export class AllExceptionsFilter
  implements ExceptionFilter, GqlExceptionFilter
{
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): unknown {
    if (host.getType<GqlContextType>() === 'graphql') {
      return this.catchGraphQL(exception, host);
    }

    return this.catchHttp(exception, host);
  }

  private catchGraphQL(exception: unknown, host: ArgumentsHost): unknown {
    const mappedException = DatabaseExceptionMapper.map(exception);

    if (
      mappedException instanceof AppException ||
      mappedException instanceof HttpException
    ) {
      return mappedException;
    }

    const gqlHost = GqlArgumentsHost.create(host);
    const ctx = gqlHost.getContext<GraphQLRequestContext>();

    this.logger.error(
      `Unhandled exception requestId=${ctx?.requestId ?? 'unknown'}`,
      mappedException instanceof Error
        ? mappedException.stack
        : String(mappedException),
    );

    return mappedException;
  }

  private catchHttp(exception: unknown, host: ArgumentsHost): void {
    const mappedException = DatabaseExceptionMapper.map(exception);

    const context = host.switchToHttp();
    const request = context.getRequest<Request>();
    const response = context.getResponse<Response>();

    const requestId = request.header('x-request-id');
    const path = request.originalUrl ?? request.url;

    if (mappedException instanceof AppException) {
      const status = this.getStatus(mappedException.code);

      response.status(status).json({
        statusCode: status,
        code: mappedException.code,
        message: mappedException.message,
        ...(mappedException.details !== undefined && {
          details: mappedException.details,
        }),
        requestId,
        timestamp: new Date().toISOString(),
        path,
      });
      return;
    }

    if (mappedException instanceof HttpException) {
      const status = mappedException.getStatus();
      const exceptionResponse = mappedException.getResponse();

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
      mappedException instanceof Error
        ? mappedException.stack
        : String(mappedException),
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
