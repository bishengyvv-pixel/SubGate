import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { ConfigsService } from './configs.service';
import { CreateConfigDto } from './dto/create-config.dto';
import { UpdateConfigDto } from './dto/update-config.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { CurrentUser, IJwtUser } from '@/common/decorators/current-user.decorator';
import { IConfig } from '@subgate/types';

@ApiTags('Configs')
@ApiBearerAuth()
@Controller('api/configs')
@UseGuards(JwtAuthGuard)
export class ConfigsController {
  constructor(private readonly configsService: ConfigsService) {}

  @Get()
  @ApiOperation({ summary: '获取配置模板列表' })
  async findAll(@CurrentUser() user: IJwtUser): Promise<IConfig[]> {
    return this.configsService.findAll(user.id);
  }

  @Post()
  @ApiOperation({ summary: '创建配置模板' })
  @ApiResponse({ status: 201, description: '创建成功' })
  @ApiResponse({ status: 400, description: '参数校验失败' })
  async create(@CurrentUser() user: IJwtUser, @Body() dto: CreateConfigDto): Promise<IConfig> {
    return this.configsService.create(user.id, dto);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取配置模板详情' })
  @ApiResponse({ status: 404, description: '未找到' })
  async findById(@CurrentUser() user: IJwtUser, @Param('id') id: string): Promise<IConfig> {
    return this.configsService.findById(user.id, id);
  }

  @Put(':id')
  @ApiOperation({ summary: '更新配置模板' })
  async update(
    @CurrentUser() user: IJwtUser,
    @Param('id') id: string,
    @Body() dto: UpdateConfigDto,
  ): Promise<IConfig> {
    return this.configsService.update(user.id, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '删除配置模板' })
  @ApiResponse({ status: 204, description: '删除成功' })
  async remove(@CurrentUser() user: IJwtUser, @Param('id') id: string): Promise<void> {
    return this.configsService.remove(user.id, id);
  }
}
