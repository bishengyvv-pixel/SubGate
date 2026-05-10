import { Controller, Get, Param, Query, UseGuards, Res } from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { ConverterService, GenerationResult } from './converter.service';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { CurrentUser, IJwtUser } from '@/common/decorators/current-user.decorator';
import { ConfigTargetType } from '@subgate/types';

@ApiTags('Converter')
@Controller('api')
export class ConverterController {
  constructor(private readonly converterService: ConverterService) {}

  @Get('generate')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '生成订阅配置' })
  @ApiQuery({ name: 'sources', description: '订阅源 ID（逗号分隔）', example: 'uuid1,uuid2' })
  @ApiQuery({ name: 'target', required: false, description: '目标格式', example: 'clash' })
  @ApiResponse({ status: 200, description: '生成成功，返回 UUID + 配置内容' })
  async generate(
    @CurrentUser() user: IJwtUser,
    @Query('sources') sources: string,
    @Query('target') target?: string,
  ): Promise<GenerationResult> {
    const sourceIds = sources ? sources.split(',').filter(Boolean) : [];
    const targetType = (target || 'clash') as ConfigTargetType;

    return this.converterService.generate(user.id, sourceIds, targetType);
  }

  @Get('sub/:uuid')
  @ApiOperation({ summary: '获取托管订阅（无需鉴权）' })
  @ApiResponse({ status: 200, description: '返回原始代理配置文本' })
  @ApiResponse({ status: 404, description: '订阅未找到或已过期' })
  async getHostedSub(@Param('uuid') uuid: string, @Res() res: Response) {
    const content = await this.converterService.getHostedSub(uuid);
    res.set('Content-Type', 'text/plain; charset=utf-8');
    res.send(content);
  }
}
