import {
  IsEnum,
  IsInt,
  IsOptional,
  Min,
} from 'class-validator';

import { OrderStatus } from '../../order.types';

export class UpdateOrderInput {
  @IsOptional()
  @IsInt()
  @Min(1)
  quantity?: number;

  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;
}
