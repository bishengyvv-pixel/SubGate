import { IsString, IsOptional, IsDateString, IsUrl, MaxLength } from 'class-validator';
import { ICreateVaultDto } from '@subgate/types';

export class CreateVaultDto implements ICreateVaultDto {
  @IsUrl({ protocols: ['http', 'https'] }, { message: 'Invalid URL format' })
  @MaxLength(2048)
  contentUrl!: string;

  @IsOptional()
  @IsString()
  @MaxLength(256)
  tags?: string;

  @IsOptional()
  @IsDateString()
  expiryDate?: string;
}
