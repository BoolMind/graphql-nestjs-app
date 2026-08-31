import { registerAs } from '@nestjs/config';

export const appConfig = registerAs('app', () => ({
  name: process.env.APP_NAME ?? 'graphql-nestjs',
  environment: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.APP_PORT ?? 3000),
  corsOrigins: (process.env.CORS_ORIGINS ?? '').split(',').filter(Boolean),
}));
