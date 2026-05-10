import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateSourceDto } from './dto/create-source.dto';
import { UpdateSourceDto } from './dto/update-source.dto';
import { ISource, IPaginatedResponse } from '@subgate/types';

@Injectable()
export class SourcesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(userId: string, page = 1, limit = 20): Promise<IPaginatedResponse<ISource>> {
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.prisma.source.findMany({
        where: { userId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.source.count({ where: { userId } }),
    ]);

    return {
      items: items.map(this.mapSource),
      total,
    };
  }

  async findById(userId: string, id: string): Promise<ISource> {
    const source = await this.prisma.source.findUnique({ where: { id } });

    if (!source) {
      throw new NotFoundException('Source not found');
    }

    if (source.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    return this.mapSource(source);
  }

  async create(userId: string, dto: CreateSourceDto): Promise<ISource> {
    const source = await this.prisma.source.create({
      data: {
        userId,
        name: dto.name,
        url: dto.url,
        note: dto.note,
      },
    });

    return this.mapSource(source);
  }

  async update(userId: string, id: string, dto: UpdateSourceDto): Promise<ISource> {
    const source = await this.prisma.source.findUnique({ where: { id } });

    if (!source) {
      throw new NotFoundException('Source not found');
    }

    if (source.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    const updated = await this.prisma.source.update({
      where: { id },
      data: dto,
    });

    return this.mapSource(updated);
  }

  async remove(userId: string, id: string): Promise<void> {
    const source = await this.prisma.source.findUnique({ where: { id } });

    if (!source) {
      throw new NotFoundException('Source not found');
    }

    if (source.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    await this.prisma.source.delete({ where: { id } });
  }

  private mapSource(source: {
    id: string;
    userId: string;
    name: string;
    url: string;
    isActive: boolean;
    note: string | null;
    createdAt: Date;
    updatedAt: Date;
  }): ISource {
    return {
      id: source.id,
      userId: source.userId,
      name: source.name,
      url: source.url,
      isActive: source.isActive,
      note: source.note,
      createdAt: source.createdAt.toISOString(),
      updatedAt: source.updatedAt.toISOString(),
    };
  }
}
