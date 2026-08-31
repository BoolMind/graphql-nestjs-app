import { registerAs } from '@nestjs/config';

export const graphqlConfig = registerAs('graphql', () => ({
  path: process.env.GRAPHQL_PATH ?? '/graphql',

  graphiql:
    process.env.NODE_ENV !== 'production' &&
    process.env.GRAPHQL_GRAPHIQL === 'true',
}));
