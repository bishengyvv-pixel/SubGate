import { IsString, IsUrl, MaxLength, IsOptional, IsBoolean } from 'class-validator';
import { IUpdateSourceDto } from '@subgate/types';

export class UpdateSourceDto implements IUpdateSourceDto {
  @IsOptional()
  @IsString()
  @MaxLength(128)
  name?: string;

  @IsOptional()
  @IsUrl({ protocols: ['http', 'https'] }, { message: 'Invalid URL format' })
  @MaxLength(2048)
  url?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(512)
  note?: string;
}
