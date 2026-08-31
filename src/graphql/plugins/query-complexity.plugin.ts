import { Injectable } from '@nestjs/common';
import { Plugin } from '@nestjs/apollo';
import {
  ApolloServerPlugin,
  BaseContext,
  GraphQLRequestListener,
} from '@apollo/server';
import { GraphQLError } from 'graphql';

import { getComplexity, simpleEstimator } from 'graphql-query-complexity';

@Plugin()
@Injectable()
export class QueryComplexityPlugin implements ApolloServerPlugin {
  private readonly maximumComplexity = 1000;

  async requestDidStart(): Promise<GraphQLRequestListener<BaseContext>> {
    const maximumComplexity = this.maximumComplexity;

    return {
      async didResolveOperation({ request, document, schema }) {
        const complexity = getComplexity({
          schema,
          query: document,
          variables: request.variables ?? {},
          operationName: request.operationName,
          estimators: [
            simpleEstimator({
              defaultComplexity: 1,
            }),
          ],
        });

        if (complexity > maximumComplexity) {
          throw new GraphQLError(
            `Query is too complex. Maximum allowed complexity is ${maximumComplexity}.`,
            {
              extensions: {
                code: 'QUERY_TOO_COMPLEX',
              },
            },
          );
        }
      },
    };
  }
}
