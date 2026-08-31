import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';

import { DataSource } from 'typeorm';

@Controller('health')
export class HealthController {
  private readonly logger = new Logger(HealthController.name);

  constructor(private readonly dataSource: DataSource) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  health(): { status: string; service: string; timestamp: string } {
    return {
      status: 'ok',
      service: 'graphql-nestjs',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('ready')
  @HttpCode(HttpStatus.OK)
  async readiness(): Promise<{
    status: string;
    database: string;
    timestamp: string;
  }> {
    try {
      if (!this.dataSource.isInitialized) {
        throw new Error('Database is not initialized');
      }

      await this.dataSource.query('SELECT 1');

      return {
        status: 'ready',
        database: 'up',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(
        'Readiness check failed',
        error instanceof Error ? error.stack : String(error),
      );

      throw new ServiceUnavailableException({
        code: 'SERVICE_UNAVAILABLE',
        message: 'Application is not ready',
        database: 'down',
        timestamp: new Date().toISOString(),
      });
    }
  }
}
