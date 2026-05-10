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
import { ConfigsService } from './configs.service';
import { CreateConfigDto } from './dto/create-config.dto';
import { UpdateConfigDto } from './dto/update-config.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { CurrentUser, IJwtUser } from '@/common/decorators/current-user.decorator';
import { IConfig } from '@subgate/types';

@Controller('api/configs')
@UseGuards(JwtAuthGuard)
export class ConfigsController {
  constructor(private readonly configsService: ConfigsService) {}

  @Get()
  async findAll(@CurrentUser() user: IJwtUser): Promise<IConfig[]> {
    return this.configsService.findAll(user.id);
  }

  @Post()
  async create(@CurrentUser() user: IJwtUser, @Body() dto: CreateConfigDto): Promise<IConfig> {
    return this.configsService.create(user.id, dto);
  }

  @Get(':id')
  async findById(@CurrentUser() user: IJwtUser, @Param('id') id: string): Promise<IConfig> {
    return this.configsService.findById(user.id, id);
  }

  @Put(':id')
  async update(
    @CurrentUser() user: IJwtUser,
    @Param('id') id: string,
    @Body() dto: UpdateConfigDto,
  ): Promise<IConfig> {
    return this.configsService.update(user.id, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@CurrentUser() user: IJwtUser, @Param('id') id: string): Promise<void> {
    return this.configsService.remove(user.id, id);
  }
}
