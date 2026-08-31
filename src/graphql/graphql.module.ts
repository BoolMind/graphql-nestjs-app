import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql';

import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';

import { join } from 'path';
import type { IncomingMessage } from 'http';

import depthLimit from 'graphql-depth-limit';

import type { Request, Response } from 'express';

import { formatGraphQLError } from './graphql-exception.formatter';
import { DateTimeScalar } from './scalars/date-time.scalar';
import { isWsConnectionAllowed } from './subscriptions/ws-rate-limiter';
import { QueryComplexityPlugin } from './plugins/query-complexity.plugin';

import { REQUEST_ID_HEADER } from '../common/middleware/request-id.middleware';

@Module({
  imports: [
    GraphQLModule.forRootAsync<ApolloDriverConfig>({
      driver: ApolloDriver,

      inject: [ConfigService],

      useFactory: (configService: ConfigService): ApolloDriverConfig => {
        const isProduction =
          configService.getOrThrow<string>('app.environment') === 'production';

        return {
          typePaths: [join(__dirname, '..', '**/*.graphql')],

          sortSchema: true,

          path: configService.getOrThrow<string>('graphql.path'),

          graphiql: configService.getOrThrow<boolean>('graphql.graphiql'),

          introspection: !isProduction,

          csrfPrevention: true,

          allowBatchedHttpRequests: false,

          includeStacktraceInErrorResponses: !isProduction,

          subscriptions: {
            'graphql-ws': {
              onConnect: (ctx) => {
                const extra = ctx.extra as
                  { request?: IncomingMessage } | undefined;
                const ip = extra?.request?.socket?.remoteAddress ?? 'unknown';

                if (!isWsConnectionAllowed(ip)) {
                  throw new Error(
                    'Too many subscription connection attempts. Please try again later.',
                  );
                }
              },
            },
          },

          validationRules: [depthLimit(8)],

          formatError: formatGraphQLError,

          context: ({ req, res }: { req?: Request; res?: Response }) => {
            const requestId =
              req?.header(REQUEST_ID_HEADER) ??
              res?.getHeader(REQUEST_ID_HEADER)?.toString() ??
              'unknown';

            return { req, res, requestId };
          },
        };
      },
    }),
  ],
  providers: [DateTimeScalar, QueryComplexityPlugin],
})
export class AppGraphQLModule {}
