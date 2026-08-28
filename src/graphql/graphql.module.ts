import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql';
import {
  ApolloDriver,
  ApolloDriverConfig,
} from '@nestjs/apollo';
import { join } from 'path';
import type { Request, Response } from 'express';

import { UserModule } from '../modules/user/user.module';
import { formatGraphQLError } from './graphql-exception.formatter';
import { REQUEST_ID_HEADER } from '../common/middleware/request-id.middleware';

interface GraphQLContext {
  req: Request;
  res: Response;
  requestId: string;
}

@Module({
  imports: [
    GraphQLModule.forRootAsync<ApolloDriverConfig>({
      driver: ApolloDriver,

      inject: [ConfigService],

      useFactory: (
        configService: ConfigService,
      ): ApolloDriverConfig => {
        const isProduction =
          configService.getOrThrow<string>(
            'app.environment',
          ) === 'production';

        return {
          typePaths: [
            join(process.cwd(), 'src/**/*.graphql'),
          ],

          sortSchema: true,

          path: configService.getOrThrow<string>(
            'graphql.path',
          ),

          playground: !isProduction,

          formatError: formatGraphQLError,

          context: ({
            req,
            res,
          }: {
            req: Request;
            res: Response;
          }): GraphQLContext => {
            const requestId =
              req.header(REQUEST_ID_HEADER) ??
              res
                .getHeader(REQUEST_ID_HEADER)
                ?.toString() ??
              'unknown';

            return {
              req,
              res,
              requestId,
            };
          },
        };
      },
    }),

    UserModule,
  ],
})
export class AppGraphQLModule {}
