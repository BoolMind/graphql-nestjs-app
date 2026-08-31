import { join } from 'node:path';

import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { TransactionService } from './transaction.service';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],

      useFactory: (configService: ConfigService) => ({
        type: 'mysql',

        host: configService.getOrThrow<string>('database.host'),

        port: configService.getOrThrow<number>('database.port'),

        username: configService.getOrThrow<string>('database.username'),

        password: configService.getOrThrow<string>('database.password'),

        database: configService.getOrThrow<string>('database.database'),

        synchronize: configService.getOrThrow<boolean>('database.synchronize'),

        logging: configService.getOrThrow<boolean>('database.logging'),

        autoLoadEntities: true,

        migrations: [join(__dirname, 'migrations/*{.js,.ts}')],

        migrationsRun: false,
      }),
    }),
  ],

  providers: [TransactionService],

  exports: [TransactionService],
})
export class DatabaseModule {}
