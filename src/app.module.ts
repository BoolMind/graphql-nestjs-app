import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';

import { DatabaseModule } from './database';
import { AppGraphQLModule } from './graphql/graphql.module';
import { PubSubModule } from './graphql/subscriptions/pubsub.module';

import { configuration, envValidationSchema } from './config';

import { LoggingInterceptor } from './common/interceptors';
import { LoggerModule } from './common/logging';
import { requestIdMiddleware } from './common/middleware/request-id.middleware';

import { ProductModule } from './modules/product/product.module';
import { OrderModule } from './modules/order/order.module';
import { UserModule } from './modules/user/user.module';
import { HealthModule } from './health';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      expandVariables: false,
      load: configuration,
      validationSchema: envValidationSchema,
    }),

    LoggerModule,

    DatabaseModule,

    AppGraphQLModule,

    PubSubModule,

    HealthModule,

    UserModule,

    ProductModule,

    OrderModule,
  ],

  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(requestIdMiddleware).forRoutes('*');
  }
}
