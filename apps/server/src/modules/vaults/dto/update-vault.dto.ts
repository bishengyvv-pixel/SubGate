import { IsString, IsOptional, IsDateString, MaxLength } from 'class-validator';
import { IUpdateVaultDto } from '@subgate/types';

export class UpdateVaultDto implements IUpdateVaultDto {
  @IsOptional()
  @IsString()
  @MaxLength(256)
  tags?: string;

  @IsOptional()
  @IsDateString()
  expiryDate?: string;
}
