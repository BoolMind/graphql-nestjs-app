import {
  Args,
  ID,
  Int,
  Mutation,
  Query,
  Resolver,
  Subscription,
} from '@nestjs/graphql';
import { PubSub } from 'graphql-subscriptions';

import { Product } from '../entities/product.entity';
import { ProductService } from '../product.service';
import type { ProductListArgs } from '../product.types';
import {
  CreateProductInput,
  UpdateProductInput,
} from './inputs';

export const PRODUCT_CREATED = 'PRODUCT_CREATED';

@Resolver(() => Product)
export class ProductResolver {
  constructor(
    private readonly productService: ProductService,
    private readonly pubSub: PubSub,
  ) {}

  @Query('products')
  async products(
    @Args('page', {
      type: () => Int,
      nullable: true,
      defaultValue: 1,
    })
    page: number,

    @Args('limit', {
      type: () => Int,
      nullable: true,
      defaultValue: 20,
    })
    limit: number,

    @Args('sortBy', { nullable: true })
    sortBy: ProductListArgs['sortBy'],

    @Args('sortOrder', { nullable: true })
    sortOrder: ProductListArgs['sortOrder'],

    @Args('search', { nullable: true })
    search?: string,
  ) {
    return this.productService.findAll({
      page,
      limit,
      sortBy,
      sortOrder,
      search,
    });
  }

  @Query('product')
  async product(
    @Args('id', { type: () => ID })
    id: string,
  ) {
    return this.productService.findById(id);
  }

  @Mutation('createProduct')
  async createProduct(
    @Args('input')
    input: CreateProductInput,
  ) {
    const product = await this.productService.create(input);

    await this.pubSub.publish(PRODUCT_CREATED, {
      productCreated: product,
    });

    return product;
  }

  @Mutation('updateProduct')
  async updateProduct(
    @Args('id', { type: () => ID })
    id: string,

    @Args('input')
    input: UpdateProductInput,
  ) {
    return this.productService.update(id, input);
  }

  @Mutation('deleteProduct')
  async deleteProduct(
    @Args('id', { type: () => ID })
    id: string,
  ) {
    return this.productService.delete(id);
  }

  @Subscription('productCreated', {
    filter: () => true,
  })
  productCreated() {
    return this.pubSub.asyncIterableIterator(PRODUCT_CREATED);
  }
}
