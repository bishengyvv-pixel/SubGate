import { IsString, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { IRegisterDto } from '@subgate/types';

export class RegisterDto implements IRegisterDto {
  @ApiProperty({ description: '用户名', minLength: 3, maxLength: 32, example: 'john' })
  @IsString()
  @MinLength(3)
  @MaxLength(32)
  username!: string;

  @ApiProperty({ description: '密码', minLength: 6, maxLength: 128, example: 'secret123' })
  @IsString()
  @MinLength(6)
  @MaxLength(128)
  password!: string;
}
