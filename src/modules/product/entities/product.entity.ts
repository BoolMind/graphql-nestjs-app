import { Column, Entity, Index } from 'typeorm';

import { BaseEntity } from '../../../common/base';

@Entity('products')
@Index(['name'], { unique: true })
export class Product extends BaseEntity {
  @Column({ type: 'varchar', length: 150 })
  name!: string;

  @Column({ type: 'text' })
  description!: string;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => parseFloat(value),
    },
  })
  price!: number;

  @Column({ type: 'int', default: 0 })
  stock!: number;
}
