import { LogLevel } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';

import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters';
import { ValidationPipe } from './common/pipes';
import { graphqlRateLimiter } from './common/security';

const LOG_LEVELS: Record<string, LogLevel[]> = {
  error: ['error'],
  warn: ['error', 'warn'],
  log: ['error', 'warn', 'log'],
  debug: ['error', 'warn', 'log', 'debug'],
  verbose: ['error', 'warn', 'log', 'debug', 'verbose'],
};

function resolveLogLevels(): LogLevel[] {
  const configured = (process.env.LOG_LEVEL ?? 'log').toLowerCase();
  return LOG_LEVELS[configured] ?? LOG_LEVELS.log;
}

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, {
    forceCloseConnections: true,
    logger: resolveLogLevels(),
  });

  const configService = app.get(ConfigService);

  const expressApp = app.getHttpAdapter().getInstance();
  expressApp.set('trust proxy', 1);

  app.use(helmet({ contentSecurityPolicy: false }));

  const isProduction =
    configService.getOrThrow<string>('app.environment') === 'production';
  const corsOrigins = configService.getOrThrow<string[]>('app.corsOrigins');

  if (isProduction && corsOrigins.length === 0) {
    throw new Error(
      'CORS_ORIGINS must be explicitly set (comma-separated) when NODE_ENV=production',
    );
  }

  app.enableCors({
    origin: corsOrigins,
    credentials: true,
  });

  app.use('/graphql', graphqlRateLimiter);

  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalPipes(new ValidationPipe());

  app.enableShutdownHooks();

  const port = configService.getOrThrow<number>('app.port');
  await app.listen(port);
}

void bootstrap();
