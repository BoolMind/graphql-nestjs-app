import 'dotenv/config';
import 'reflect-metadata';
import { DataSource } from 'typeorm';

import { User } from '../modules/user/entities/user.entity';
import { Product } from '../modules/product/entities/product.entity';
import { Order } from '../modules/order/entities/order.entity';

export default new DataSource({
  type: 'mysql',

  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 3306),

  username: process.env.DB_USERNAME ?? 'root',

  password: process.env.DB_PASSWORD ?? '',

  database: process.env.DB_NAME ?? 'graphql_nestjs',

  entities: [User, Product, Order],

  migrations: [__dirname + '/migrations/*{.js,.ts}'],

  synchronize: false,

  logging: process.env.DB_LOGGING === 'true',
});
