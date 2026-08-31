import type { ListArgs } from '../../common/types';

export type ProductSortField =
  'CREATED_AT' | 'UPDATED_AT' | 'NAME' | 'PRICE' | 'STOCK';

export interface CreateProductData {
  name: string;
  description: string;
  price: number;
  stock?: number;
}

export interface UpdateProductData {
  name?: string;
  description?: string;
  price?: number;
  stock?: number;
}

export type ProductListArgs = ListArgs<ProductSortField>;
