import { IsString, IsOptional, IsIn, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ICreateConfigDto, ConfigTargetType } from '@subgate/types';

const TARGET_TYPES: ConfigTargetType[] = ['clash', 'surge', 'quantumultx', 'stash'];

export class CreateConfigDto implements ICreateConfigDto {
  @ApiProperty({ description: '模板名称', maxLength: 128, example: 'AI 优先' })
  @IsString()
  @MaxLength(128)
  templateName!: string;

  @ApiPropertyOptional({ description: '自定义规则' })
  @IsOptional()
  @IsString()
  customRules?: string;

  @ApiProperty({ description: '目标格式', enum: TARGET_TYPES, example: 'clash' })
  @IsIn(TARGET_TYPES)
  targetType!: ConfigTargetType;
}
