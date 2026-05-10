import { IsString } from 'class-validator';
import { ILoginDto } from '@subgate/types';

export class LoginDto implements ILoginDto {
  @IsString()
  username!: string;

  @IsString()
  password!: string;
}
