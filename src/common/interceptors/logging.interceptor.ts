import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';

import { REQUEST_ID_HEADER } from '../middleware/request-id.middleware';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<unknown> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();

    const method = request.method;
    const url = request.originalUrl ?? request.url;
    const requestId = request.header(REQUEST_ID_HEADER);

    const startedAt = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const duration = Date.now() - startedAt;

          this.logger.log(
            `${method} ${url} ${response.statusCode} ${duration}ms requestId=${requestId ?? 'unknown'}`,
          );
        },
        error: (error: unknown) => {
          const duration = Date.now() - startedAt;

          this.logger.error(
            `${method} ${url} ${response.statusCode} ${duration}ms requestId=${requestId ?? 'unknown'}`,
            error instanceof Error ? error.stack : undefined,
          );
        },
      }),
    );
  }
}
