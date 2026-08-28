import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PubSub } from 'graphql-subscriptions';

import { Product } from './entities/product.entity';
import { ProductResolver } from './graphql/product.resolver';
import { ProductService } from './product.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Product]),
  ],
  providers: [
    ProductService,
    ProductResolver,
    PubSub,
  ],
  exports: [
    ProductService,
  ],
})
export class ProductModule {}
