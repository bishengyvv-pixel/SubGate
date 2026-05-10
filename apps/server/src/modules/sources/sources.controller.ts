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
import { SourcesService } from './sources.service';
import { CreateSourceDto } from './dto/create-source.dto';
import { UpdateSourceDto } from './dto/update-source.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { CurrentUser, IJwtUser } from '@/common/decorators/current-user.decorator';
import { ISource, IPaginatedResponse } from '@subgate/types';

@Controller('api/sources')
@UseGuards(JwtAuthGuard)
export class SourcesController {
  constructor(private readonly sourcesService: SourcesService) {}

  @Get()
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
  async create(@CurrentUser() user: IJwtUser, @Body() dto: CreateSourceDto): Promise<ISource> {
    return this.sourcesService.create(user.id, dto);
  }

  @Get(':id')
  async findById(@CurrentUser() user: IJwtUser, @Param('id') id: string): Promise<ISource> {
    return this.sourcesService.findById(user.id, id);
  }

  @Put(':id')
  async update(
    @CurrentUser() user: IJwtUser,
    @Param('id') id: string,
    @Body() dto: UpdateSourceDto,
  ): Promise<ISource> {
    return this.sourcesService.update(user.id, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@CurrentUser() user: IJwtUser, @Param('id') id: string): Promise<void> {
    return this.sourcesService.remove(user.id, id);
  }
}
