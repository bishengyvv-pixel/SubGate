import { IsString, IsOptional, IsIn, MaxLength } from 'class-validator';
import { ICreateConfigDto, ConfigTargetType } from '@subgate/types';

const TARGET_TYPES: ConfigTargetType[] = ['clash', 'surge', 'quantumultx', 'stash'];

export class CreateConfigDto implements ICreateConfigDto {
  @IsString()
  @MaxLength(128)
  templateName!: string;

  @IsOptional()
  @IsString()
  customRules?: string;

  @IsIn(TARGET_TYPES)
  targetType!: ConfigTargetType;
}
