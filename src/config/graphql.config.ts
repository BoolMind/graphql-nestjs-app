import { registerAs } from '@nestjs/config';

export const graphqlConfig = registerAs(
  'graphql',
  () => ({
    path:
      process.env.GRAPHQL_PATH ??
      '/graphql',

    playground:
      process.env.NODE_ENV !== 'production' &&
      process.env.GRAPHQL_PLAYGROUND === 'true',
  }),
);
