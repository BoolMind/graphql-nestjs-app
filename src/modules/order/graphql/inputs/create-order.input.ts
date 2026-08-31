import { IsInt, IsNotEmpty, IsUUID, Min } from 'class-validator';

export class CreateOrderInput {
  @IsUUID()
  @IsNotEmpty()
  userId!: string;

  @IsUUID()
  @IsNotEmpty()
  productId!: string;

  @IsInt()
  @Min(1)
  quantity!: number;
}
