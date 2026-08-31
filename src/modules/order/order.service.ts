import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsRelations, Repository, SelectQueryBuilder } from 'typeorm';

import {
  BaseService,
  ConflictException,
  NotFoundException,
} from '../../common';

import { TransactionService } from '../../database';
import { Product } from '../product/entities/product.entity';
import { User } from '../user/entities/user.entity';

import { Order } from './entities/order.entity';
import {
  CreateOrderData,
  OrderListArgs,
  OrderSortField,
  OrderStatus,
  UpdateOrderData,
} from './order.types';

const SORT_FIELD_MAP: Record<OrderSortField, string> = {
  CREATED_AT: 'createdAt',
  UPDATED_AT: 'updatedAt',
  QUANTITY: 'quantity',
  STATUS: 'status',
};

const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  [OrderStatus.PENDING]: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
  [OrderStatus.CONFIRMED]: [OrderStatus.SHIPPED, OrderStatus.CANCELLED],
  [OrderStatus.SHIPPED]: [OrderStatus.DELIVERED],
  [OrderStatus.DELIVERED]: [],
  [OrderStatus.CANCELLED]: [],
};

@Injectable()
export class OrderService extends BaseService<
  Order,
  CreateOrderData,
  UpdateOrderData
> {
  constructor(
    @InjectRepository(Order)
    repository: Repository<Order>,

    private readonly transactionService: TransactionService,
  ) {
    super(repository);
  }

  protected override relations(): FindOptionsRelations<Order> {
    return { user: true, product: true };
  }

  protected override sortFieldMap(): Record<string, string> {
    return SORT_FIELD_MAP;
  }

  protected override applyFilters(
    qb: SelectQueryBuilder<Order>,
    alias: string,
    args: OrderListArgs,
  ): void {
    if (args.status) {
      qb.andWhere(`${alias}.status = :status`, { status: args.status });
    }
  }

  async create(input: CreateOrderData): Promise<Order> {
    return this.transactionService.run(async (manager) => {
      const user = await manager.findOne(User, {
        where: { id: input.userId },
      });

      if (!user) {
        throw new NotFoundException(`User with id "${input.userId}" not found`);
      }

      const product = await manager.findOne(Product, {
        where: { id: input.productId },
        lock: {
          mode: 'pessimistic_write',
        },
      });

      if (!product) {
        throw new NotFoundException(
          `Product with id "${input.productId}" not found`,
        );
      }

      if (product.stock < input.quantity) {
        throw new ConflictException(
          `Cannot order ${input.quantity} unit(s) of "${product.name}" — only ${product.stock} in stock`,
        );
      }

      product.stock -= input.quantity;
      await manager.save(Product, product);

      const order = manager.create(Order, {
        quantity: input.quantity,
        status: OrderStatus.PENDING,
        user,
        product,
      });

      return manager.save(Order, order);
    });
  }

  async update(id: string, input: UpdateOrderData): Promise<Order> {
    if ((input as { quantity?: number }).quantity !== undefined) {
      throw new ConflictException(
        'Order quantity cannot be changed after creation',
      );
    }

    if (input.status === OrderStatus.CANCELLED) {
      return this.transactionService.run(async (manager) => {
        const order = await manager.findOne(Order, {
          where: { id },
          relations: {
            product: true,
            user: true,
          },
          lock: {
            mode: 'pessimistic_write',
          },
        });

        if (!order) {
          throw new NotFoundException(`Order with id "${id}" not found`);
        }

        if (order.status === OrderStatus.CANCELLED) {
          throw new ConflictException('Order is already cancelled');
        }

        const allowed = ALLOWED_TRANSITIONS[order.status] ?? [];

        if (!allowed.includes(OrderStatus.CANCELLED)) {
          throw new ConflictException(
            `Cannot transition order from ${order.status} to ${OrderStatus.CANCELLED}`,
          );
        }

        await manager
          .createQueryBuilder()
          .update(Product)
          .set({
            stock: () => `stock + ${order.quantity}`,
          })
          .where('id = :id', { id: order.product.id })
          .execute();

        order.status = OrderStatus.CANCELLED;

        return manager.save(Order, order);
      });
    }

    const order = await this.findById(id);

    if (input.status && input.status !== order.status) {
      const allowed = ALLOWED_TRANSITIONS[order.status] ?? [];

      if (!allowed.includes(input.status)) {
        throw new ConflictException(
          `Cannot transition order from ${order.status} to ${input.status}`,
        );
      }
    }

    return super.update(id, input);
  }
}
