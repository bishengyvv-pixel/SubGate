import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ILoginDto } from '@subgate/types';

export class LoginDto implements ILoginDto {
  @ApiProperty({ description: '用户名', example: 'john' })
  @IsString()
  username!: string;

  @ApiProperty({ description: '密码', example: 'secret123' })
  @IsString()
  password!: string;
}
