import { IsEmail, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateUserInput {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  email?: string;
}
