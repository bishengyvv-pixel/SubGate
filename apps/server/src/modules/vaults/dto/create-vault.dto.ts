import { IsString, IsOptional, IsDateString, IsUrl, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ICreateVaultDto } from '@subgate/types';

export class CreateVaultDto implements ICreateVaultDto {
  @ApiProperty({ description: '订阅内容 URL', example: 'https://example.com/sub' })
  @IsUrl({ protocols: ['http', 'https'] }, { message: 'Invalid URL format' })
  @MaxLength(2048)
  contentUrl!: string;

  @ApiPropertyOptional({ description: '标签（逗号分隔）', example: 'work,proxy' })
  @IsOptional()
  @IsString()
  @MaxLength(256)
  tags?: string;

  @ApiPropertyOptional({ description: '过期日期', example: '2027-01-01T00:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  expiryDate?: string;
}
