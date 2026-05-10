import { IsString, MinLength, MaxLength } from 'class-validator';
import { IUpdatePasswordDto } from '@subgate/types';

export class UpdatePasswordDto implements IUpdatePasswordDto {
  @IsString()
  oldPassword!: string;

  @IsString()
  @MinLength(6)
  @MaxLength(128)
  newPassword!: string;
}
