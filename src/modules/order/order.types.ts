import type { ListArgs } from '../../common/types';

export enum OrderStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  SHIPPED = 'SHIPPED',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
}

export type OrderSortField =
  'CREATED_AT' | 'UPDATED_AT' | 'QUANTITY' | 'STATUS';

export interface CreateOrderData {
  userId: string;
  productId: string;
  quantity: number;
}

export interface UpdateOrderData {
  status?: OrderStatus;
}

export interface OrderListArgs extends ListArgs<OrderSortField> {
  status?: OrderStatus;
}
