import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { SourcesService } from './sources.service';
import { CreateSourceDto } from './dto/create-source.dto';
import { UpdateSourceDto } from './dto/update-source.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { CurrentUser, IJwtUser } from '@/common/decorators/current-user.decorator';
import { ISource, IPaginatedResponse } from '@subgate/types';

@ApiTags('Sources')
@ApiBearerAuth()
@Controller('api/sources')
@UseGuards(JwtAuthGuard)
export class SourcesController {
  constructor(private readonly sourcesService: SourcesService) {}

  @Get()
  @ApiOperation({ summary: '获取订阅源列表（分页）' })
  @ApiResponse({ status: 200, description: '分页结果' })
  async findAll(
    @CurrentUser() user: IJwtUser,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ): Promise<IPaginatedResponse<ISource>> {
    return this.sourcesService.findAll(
      user.id,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
  }

  @Post()
  @ApiOperation({ summary: '添加订阅源' })
  @ApiResponse({ status: 201, description: '创建成功' })
  @ApiResponse({ status: 400, description: '参数校验失败' })
  async create(@CurrentUser() user: IJwtUser, @Body() dto: CreateSourceDto): Promise<ISource> {
    return this.sourcesService.create(user.id, dto);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取订阅源详情' })
  @ApiResponse({ status: 200, description: '订阅源详情' })
  @ApiResponse({ status: 404, description: '未找到' })
  async findById(@CurrentUser() user: IJwtUser, @Param('id') id: string): Promise<ISource> {
    return this.sourcesService.findById(user.id, id);
  }

  @Put(':id')
  @ApiOperation({ summary: '更新订阅源' })
  @ApiResponse({ status: 200, description: '更新成功' })
  @ApiResponse({ status: 404, description: '未找到' })
  async update(
    @CurrentUser() user: IJwtUser,
    @Param('id') id: string,
    @Body() dto: UpdateSourceDto,
  ): Promise<ISource> {
    return this.sourcesService.update(user.id, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '删除订阅源' })
  @ApiResponse({ status: 204, description: '删除成功' })
  @ApiResponse({ status: 404, description: '未找到' })
  async remove(@CurrentUser() user: IJwtUser, @Param('id') id: string): Promise<void> {
    return this.sourcesService.remove(user.id, id);
  }
}
