import { IsString, MinLength, MaxLength } from 'class-validator';
import { IRegisterDto } from '@subgate/types';

export class RegisterDto implements IRegisterDto {
  @IsString()
  @MinLength(3)
  @MaxLength(32)
  username!: string;

  @IsString()
  @MinLength(6)
  @MaxLength(128)
  password!: string;
}
