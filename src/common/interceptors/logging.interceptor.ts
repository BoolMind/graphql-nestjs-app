import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';

import { GqlExecutionContext } from '@nestjs/graphql';

import { Observable, tap } from 'rxjs';

interface GraphQLContext {
  requestId?: string;

  req?: {
    header(name: string): string | undefined;
  };
}

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const startedAt = Date.now();

    if (context.getType<string>() !== 'graphql') {
      return next.handle();
    }

    const gqlContext = GqlExecutionContext.create(context);

    const requestContext = gqlContext.getContext<GraphQLContext>();

    const requestId =
      requestContext?.requestId ??
      requestContext?.req?.header('x-request-id') ??
      'unknown';

    const info = gqlContext.getInfo();

    const operation = info?.fieldName ?? 'unknown';

    const operationType = info?.parentType?.name ?? 'unknown';

    return next.handle().pipe(
      tap({
        next: () => {
          this.logger.log(
            [
              'GraphQL',
              `${operationType}.${operation}`,
              `requestId=${requestId}`,
              `duration=${Date.now() - startedAt}ms`,
            ].join(' '),
          );
        },

        error: (error: unknown) => {
          this.logger.error(
            [
              'GraphQL',
              `${operationType}.${operation}`,
              `requestId=${requestId}`,
              `duration=${Date.now() - startedAt}ms`,
            ].join(' '),
            error instanceof Error ? error.stack : String(error),
          );
        },
      }),
    );
  }
}
