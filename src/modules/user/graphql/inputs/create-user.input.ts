import { IsEmail, IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateUserInput {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name!: string;

  @IsEmail()
  @IsNotEmpty()
  @MaxLength(255)
  email!: string;
}
