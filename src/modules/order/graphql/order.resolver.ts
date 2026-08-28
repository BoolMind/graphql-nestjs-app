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

import { Order } from '../entities/order.entity';
import { OrderService } from '../order.service';
import type {
  OrderListArgs,
} from '../order.types';

import {
  CreateOrderInput,
  UpdateOrderInput,
} from './inputs';

export const ORDER_CREATED = 'ORDER_CREATED';

@Resolver(() => Order)
export class OrderResolver {
  constructor(
    private readonly orderService: OrderService,
    private readonly pubSub: PubSub,
  ) {}

  @Query('orders')
  async orders(
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
    sortBy: OrderListArgs['sortBy'],

    @Args('sortOrder', { nullable: true })
    sortOrder: OrderListArgs['sortOrder'],

    @Args('status', { nullable: true })
    status: OrderListArgs['status'],
  ) {
    const args: OrderListArgs = {
      page,
      limit,
      sortBy,
      sortOrder,
      status,
    };

    return this.orderService.findAll(args);
  }

  @Query('order')
  async order(
    @Args('id', { type: () => ID })
    id: string,
  ) {
    return this.orderService.findById(id);
  }

  @Mutation('createOrder')
  async createOrder(
    @Args('input')
    input: CreateOrderInput,
  ) {
    const order = await this.orderService.create(input);

    await this.pubSub.publish(ORDER_CREATED, {
      orderCreated: order,
    });

    return order;
  }

  @Mutation('updateOrder')
  async updateOrder(
    @Args('id', { type: () => ID })
    id: string,

    @Args('input')
    input: UpdateOrderInput,
  ) {
    return this.orderService.update(id, input);
  }

  @Mutation('deleteOrder')
  async deleteOrder(
    @Args('id', { type: () => ID })
    id: string,
  ) {
    return this.orderService.delete(id);
  }

  @Subscription('orderCreated', {
    filter: (
      payload: { orderCreated: Order },
      variables: { userId: string },
    ) =>
      payload.orderCreated.user?.id ===
      variables.userId,
  })
  orderCreated() {
    return this.pubSub.asyncIterableIterator(
      ORDER_CREATED,
    );
  }
}
