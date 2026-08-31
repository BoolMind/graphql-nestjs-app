import { IsEnum, IsOptional } from 'class-validator';

import { OrderStatus } from '../../order.types';

export class UpdateOrderInput {
  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;
}
