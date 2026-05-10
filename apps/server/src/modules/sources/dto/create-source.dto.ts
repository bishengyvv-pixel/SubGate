import { IsString, IsUrl, MaxLength, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ICreateSourceDto } from '@subgate/types';

export class CreateSourceDto implements ICreateSourceDto {
  @ApiProperty({ description: '订阅源名称', maxLength: 128, example: '我的机场' })
  @IsString()
  @MaxLength(128)
  name!: string;

  @ApiProperty({ description: '订阅 URL', maxLength: 2048, example: 'https://example.com/sub' })
  @IsUrl({ protocols: ['http', 'https'] }, { message: 'Invalid URL format' })
  @MaxLength(2048)
  url!: string;

  @ApiPropertyOptional({ description: '备注', maxLength: 512 })
  @IsOptional()
  @IsString()
  @MaxLength(512)
  note?: string;
}
