import { IsString, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { IUpdatePasswordDto } from '@subgate/types';

export class UpdatePasswordDto implements IUpdatePasswordDto {
  @ApiProperty({ description: '旧密码', example: 'oldsecret123' })
  @IsString()
  oldPassword!: string;

  @ApiProperty({ description: '新密码', minLength: 6, maxLength: 128, example: 'newsecret456' })
  @IsString()
  @MinLength(6)
  @MaxLength(128)
  newPassword!: string;
}
