import { IsString, IsUrl, MaxLength, IsOptional, IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IUpdateSourceDto } from '@subgate/types';

export class UpdateSourceDto implements IUpdateSourceDto {
  @ApiPropertyOptional({ description: '订阅源名称', maxLength: 128 })
  @IsOptional()
  @IsString()
  @MaxLength(128)
  name?: string;

  @ApiPropertyOptional({ description: '订阅 URL', maxLength: 2048 })
  @IsOptional()
  @IsUrl({ protocols: ['http', 'https'] }, { message: 'Invalid URL format' })
  @MaxLength(2048)
  url?: string;

  @ApiPropertyOptional({ description: '是否启用' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: '备注', maxLength: 512 })
  @IsOptional()
  @IsString()
  @MaxLength(512)
  note?: string;
}
