import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { configuration, envValidationSchema } from './config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      expandVariables: false,
      load: configuration,
      validationSchema: envValidationSchema,
    }),
  ],
})
export class AppModule {}
