import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
} from 'typeorm';

import { BaseEntity } from '../../../common/base';
import { Product } from '../../product/entities/product.entity';
import { User } from '../../user/entities/user.entity';
import { OrderStatus } from '../order.types';

@Entity('orders')
export class Order extends BaseEntity {
  @Column({
    type: 'int',
  })
  quantity!: number;

  @Column({
    type: 'enum',
    enum: OrderStatus,
    default: OrderStatus.PENDING,
  })
  status!: OrderStatus;

  @ManyToOne(() => User, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({
    name: 'user_id',
  })
  user!: User;

  @ManyToOne(() => Product, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({
    name: 'product_id',
  })
  product!: Product;
}
