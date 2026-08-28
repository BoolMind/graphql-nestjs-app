import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PubSub } from 'graphql-subscriptions';

import { Product } from '../product/entities/product.entity';
import { User } from '../user/entities/user.entity';

import { Order } from './entities/order.entity';
import { OrderResolver } from './graphql/order.resolver';
import { OrderService } from './order.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Order,
      User,
      Product,
    ]),
  ],
  providers: [
    OrderService,
    OrderResolver,
    PubSub,
  ],
  exports: [
    OrderService,
  ],
})
export class OrderModule {}
