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
import { VaultsService } from './vaults.service';
import { CreateVaultDto } from './dto/create-vault.dto';
import { UpdateVaultDto } from './dto/update-vault.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { CurrentUser, IJwtUser } from '@/common/decorators/current-user.decorator';
import { IVault } from '@subgate/types';

@Controller('api/vault')
@UseGuards(JwtAuthGuard)
export class VaultsController {
  constructor(private readonly vaultsService: VaultsService) {}

  @Get()
  async findAll(@CurrentUser() user: IJwtUser): Promise<IVault[]> {
    return this.vaultsService.findAll(user.id);
  }

  @Post()
  async create(@CurrentUser() user: IJwtUser, @Body() dto: CreateVaultDto): Promise<IVault> {
    return this.vaultsService.create(user.id, dto);
  }

  @Get(':id')
  async findById(@CurrentUser() user: IJwtUser, @Param('id') id: string): Promise<IVault> {
    return this.vaultsService.findById(user.id, id);
  }

  @Put(':id')
  async update(
    @CurrentUser() user: IJwtUser,
    @Param('id') id: string,
    @Body() dto: UpdateVaultDto,
  ): Promise<IVault> {
    return this.vaultsService.update(user.id, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@CurrentUser() user: IJwtUser, @Param('id') id: string): Promise<void> {
    return this.vaultsService.remove(user.id, id);
  }
}
