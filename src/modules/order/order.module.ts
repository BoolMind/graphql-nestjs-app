import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { DatabaseModule } from '../../database';

import { Order } from './entities/order.entity';
import { OrderResolver } from './graphql/order.resolver';
import { OrderService } from './order.service';

@Module({
  imports: [DatabaseModule, TypeOrmModule.forFeature([Order])],

  providers: [OrderService, OrderResolver],

  exports: [OrderService],
})
export class OrderModule {}
