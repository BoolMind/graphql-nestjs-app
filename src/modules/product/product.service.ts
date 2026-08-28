import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  EntityManager,
  QueryFailedError,
  Repository,
} from 'typeorm';

import {
  BaseService,
  ConflictException,
  NotFoundException,
} from '../../common';

import { Product } from './entities/product.entity';
import {
  CreateProductData,
  ProductSortField,
  UpdateProductData,
} from './product.types';

const SORT_FIELD_MAP: Record<ProductSortField, string> = {
  CREATED_AT: 'createdAt',
  UPDATED_AT: 'updatedAt',
  NAME: 'name',
  PRICE: 'price',
  STOCK: 'stock',
};

@Injectable()
export class ProductService extends BaseService<
  Product,
  CreateProductData,
  UpdateProductData
> {
  constructor(
    @InjectRepository(Product)
    repository: Repository<Product>,
  ) {
    super(repository);
  }

  protected override searchableFields(): string[] {
    return ['name', 'description'];
  }

  protected override sortFieldMap(): Record<string, string> {
    return SORT_FIELD_MAP;
  }

  async create(input: CreateProductData): Promise<Product> {
    const data = {
      ...input,
      stock: input.stock ?? 0,
    };

    try {
      return await super.create(data);
    } catch (error) {
      if (this.isDuplicateError(error)) {
        throw new ConflictException(
          `A product with name "${data.name}" already exists`,
        );
      }

      throw error;
    }
  }

  async update(
    id: string,
    input: UpdateProductData,
  ): Promise<Product> {
    const product = await this.findById(id);

    Object.assign(product, input);

    try {
      return await this.repository.save(product);
    } catch (error) {
      if (this.isDuplicateError(error)) {
        throw new ConflictException(
          `A product with name "${input.name}" already exists`,
        );
      }

      throw error;
    }
  }

  async reserveStock(
    id: string,
    quantity: number,
    manager: EntityManager,
  ): Promise<Product> {
    const repository = manager.getRepository(Product);

    const product = await repository
      .createQueryBuilder('product')
      .setLock('pessimistic_write')
      .where('product.id = :id', { id })
      .getOne();

    if (!product) {
      throw new NotFoundException(
        `Product with id "${id}" not found`,
      );
    }

    if (product.stock < quantity) {
      throw new ConflictException(
        `Cannot order ${quantity} unit(s) of "${product.name}" — only ${product.stock} in stock`,
      );
    }

    product.stock -= quantity;

    return repository.save(product);
  }

  private isDuplicateError(error: unknown): boolean {
    if (!(error instanceof QueryFailedError)) {
      return false;
    }

    const driverError = error.driverError as {
      code?: string;
      errno?: number;
    };

    return (
      driverError.code === 'ER_DUP_ENTRY' ||
      driverError.errno === 1062
    );
  }
}
