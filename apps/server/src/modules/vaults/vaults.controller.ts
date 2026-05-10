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
import { VaultsService } from './vaults.service';
import { CreateVaultDto } from './dto/create-vault.dto';
import { UpdateVaultDto } from './dto/update-vault.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { CurrentUser, IJwtUser } from '@/common/decorators/current-user.decorator';
import { IVault } from '@subgate/types';

@ApiTags('Vault')
@ApiBearerAuth()
@Controller('api/vault')
@UseGuards(JwtAuthGuard)
export class VaultsController {
  constructor(private readonly vaultsService: VaultsService) {}

  @Get()
  @ApiOperation({ summary: '获取收藏列表' })
  async findAll(@CurrentUser() user: IJwtUser): Promise<IVault[]> {
    return this.vaultsService.findAll(user.id);
  }

  @Post()
  @ApiOperation({ summary: '添加到仓库' })
  @ApiResponse({ status: 201, description: '添加成功' })
  @ApiResponse({ status: 400, description: 'URL 格式无效' })
  async create(@CurrentUser() user: IJwtUser, @Body() dto: CreateVaultDto): Promise<IVault> {
    return this.vaultsService.create(user.id, dto);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取收藏详情' })
  @ApiResponse({ status: 404, description: '未找到' })
  async findById(@CurrentUser() user: IJwtUser, @Param('id') id: string): Promise<IVault> {
    return this.vaultsService.findById(user.id, id);
  }

  @Put(':id')
  @ApiOperation({ summary: '更新备注/标签/过期日期' })
  async update(
    @CurrentUser() user: IJwtUser,
    @Param('id') id: string,
    @Body() dto: UpdateVaultDto,
  ): Promise<IVault> {
    return this.vaultsService.update(user.id, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '移除收藏' })
  @ApiResponse({ status: 204, description: '移除成功' })
  async remove(@CurrentUser() user: IJwtUser, @Param('id') id: string): Promise<void> {
    return this.vaultsService.remove(user.id, id);
  }
}
