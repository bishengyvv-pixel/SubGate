import { Controller, Get, Param, Query, UseGuards, Res } from '@nestjs/common';
import { Response } from 'express';
import { ConverterService, GenerationResult } from './converter.service';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { CurrentUser, IJwtUser } from '@/common/decorators/current-user.decorator';
import { ConfigTargetType } from '@subgate/types';

@Controller('api')
export class ConverterController {
  constructor(private readonly converterService: ConverterService) {}

  @Get('generate')
  @UseGuards(JwtAuthGuard)
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
  async getHostedSub(@Param('uuid') uuid: string, @Res() res: Response) {
    const content = await this.converterService.getHostedSub(uuid);
    res.set('Content-Type', 'text/plain; charset=utf-8');
    res.send(content);
  }
}
