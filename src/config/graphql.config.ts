import { registerAs } from '@nestjs/config';

export const graphqlConfig = registerAs('graphql', () => ({
  path: process.env.GRAPHQL_PATH ?? '/graphql',
  playground: process.env.GRAPHQL_PLAYGROUND === 'true',
}));
