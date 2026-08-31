import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { BaseService } from '../../common';

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
    const data = { ...input, stock: input.stock ?? 0 };

    return super.create(data);
  }
}
