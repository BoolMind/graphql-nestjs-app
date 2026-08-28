import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  FindOptionsRelations,
  QueryFailedError,
  Repository,
  SelectQueryBuilder,
} from 'typeorm';

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

@Injectable()
export class OrderService extends BaseService<
  Order,
  CreateOrderData,
  UpdateOrderData
> {
  constructor(
    @InjectRepository(Order)
    repository: Repository<Order>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,

    private readonly transactionService: TransactionService,
  ) {
    super(repository);
  }

  protected override relations(): FindOptionsRelations<Order> {
    return {
      user: true,
      product: true,
    };
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
      qb.andWhere(`${alias}.status = :status`, {
        status: args.status,
      });
    }
  }

  async create(input: CreateOrderData): Promise<Order> {
    return this.transactionService.run(
      async (manager) => {
        const user = await manager
          .getRepository(User)
          .findOne({
            where: {
              id: input.userId,
            },
          });

        if (!user) {
          throw new NotFoundException(
            `User with id "${input.userId}" not found`,
          );
        }

        const product = await manager
          .getRepository(Product)
          .createQueryBuilder('product')
          .setLock('pessimistic_write')
          .where('product.id = :id', {
            id: input.productId,
          })
          .getOne();

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

        await manager
          .getRepository(Product)
          .save(product);

        const order = manager.create(Order, {
          quantity: input.quantity,
          status: OrderStatus.PENDING,
          user,
          product,
        });

        try {
          return await manager.save(Order, order);
        } catch (error) {
          this.handleDatabaseError(error);
        }
      },
    );
  }

  async update(
    id: string,
    input: UpdateOrderData,
  ): Promise<Order> {
    const order = await this.findById(id);

    if (input.quantity !== undefined) {
      throw new ConflictException(
        'Order quantity cannot be changed after creation',
      );
    }

    Object.assign(order, input);

    try {
      return await this.repository.save(order);
    } catch (error) {
      this.handleDatabaseError(error);
    }
  }

  private handleDatabaseError(error: unknown): never {
    if (error instanceof QueryFailedError) {
      throw new ConflictException(
        'Unable to complete the order operation',
      );
    }

    throw error;
  }
}
