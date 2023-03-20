import {
  IsEmail,
  IsNotEmpty,
  IsString,
  IsStrongPassword,
  Min,
  MinLength,
} from 'class-validator';

export class AuthDto {
  @IsNotEmpty()
  @IsString()
  @IsEmail()
  email: string;

  @IsStrongPassword(
    {
      minLength: 8,
      minNumbers: 2,
      minSymbols: 0,
      minUppercase: 0,
    },
    { message: 'password must be minimal 8 character and minimal 2 number' },
  )
  password: string;
}
