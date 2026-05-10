import { IsString, IsUrl, MaxLength, IsOptional } from 'class-validator';
import { ICreateSourceDto } from '@subgate/types';

export class CreateSourceDto implements ICreateSourceDto {
  @IsString()
  @MaxLength(128)
  name!: string;

  @IsUrl({ protocols: ['http', 'https'] }, { message: 'Invalid URL format' })
  @MaxLength(2048)
  url!: string;

  @IsOptional()
  @IsString()
  @MaxLength(512)
  note?: string;
}
