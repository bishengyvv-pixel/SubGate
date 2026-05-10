import { IsString, IsOptional, IsDateString, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IUpdateVaultDto } from '@subgate/types';

export class UpdateVaultDto implements IUpdateVaultDto {
  @ApiPropertyOptional({ description: '标签（逗号分隔）', example: 'updated,label' })
  @IsOptional()
  @IsString()
  @MaxLength(256)
  tags?: string;

  @ApiPropertyOptional({ description: '过期日期', example: '2028-06-01T00:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  expiryDate?: string;
}
