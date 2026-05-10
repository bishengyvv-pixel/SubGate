import { IsString, IsOptional, IsIn, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IUpdateConfigDto, ConfigTargetType } from '@subgate/types';

const TARGET_TYPES: ConfigTargetType[] = ['clash', 'surge', 'quantumultx', 'stash'];

export class UpdateConfigDto implements IUpdateConfigDto {
  @ApiPropertyOptional({ description: '模板名称', maxLength: 128 })
  @IsOptional()
  @IsString()
  @MaxLength(128)
  templateName?: string;

  @ApiPropertyOptional({ description: '自定义规则' })
  @IsOptional()
  @IsString()
  customRules?: string;

  @ApiPropertyOptional({ description: '目标格式', enum: TARGET_TYPES })
  @IsOptional()
  @IsIn(TARGET_TYPES)
  targetType?: ConfigTargetType;
}
