import { Column, Entity, Index } from 'typeorm';

import { BaseEntity } from '../../../common/base';

@Entity('users')
@Index(['email'], { unique: true })
export class User extends BaseEntity {
  @Column({
    type: 'varchar',
    length: 100,
  })
  name!: string;

  @Column({
    type: 'varchar',
    length: 255,
  })
  email!: string;
}
