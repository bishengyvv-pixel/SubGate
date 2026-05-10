import { IsString, IsOptional, IsIn, MaxLength } from 'class-validator';
import { IUpdateConfigDto, ConfigTargetType } from '@subgate/types';

const TARGET_TYPES: ConfigTargetType[] = ['clash', 'surge', 'quantumultx', 'stash'];

export class UpdateConfigDto implements IUpdateConfigDto {
  @IsOptional()
  @IsString()
  @MaxLength(128)
  templateName?: string;

  @IsOptional()
  @IsString()
  customRules?: string;

  @IsOptional()
  @IsIn(TARGET_TYPES)
  targetType?: ConfigTargetType;
}
