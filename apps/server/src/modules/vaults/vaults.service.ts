import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateVaultDto } from './dto/create-vault.dto';
import { UpdateVaultDto } from './dto/update-vault.dto';
import { IVault } from '@subgate/types';

@Injectable()
export class VaultsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(userId: string): Promise<IVault[]> {
    const vaults = await this.prisma.vault.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return vaults.map(this.mapVault);
  }

  async findById(userId: string, id: string): Promise<IVault> {
    const vault = await this.prisma.vault.findUnique({ where: { id } });

    if (!vault) {
      throw new NotFoundException('Vault item not found');
    }

    if (vault.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    return this.mapVault(vault);
  }

  async create(userId: string, dto: CreateVaultDto): Promise<IVault> {
    const vault = await this.prisma.vault.create({
      data: {
        userId,
        contentUrl: dto.contentUrl,
        tags: dto.tags,
        expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : undefined,
      },
    });

    return this.mapVault(vault);
  }

  async update(userId: string, id: string, dto: UpdateVaultDto): Promise<IVault> {
    const vault = await this.prisma.vault.findUnique({ where: { id } });

    if (!vault) {
      throw new NotFoundException('Vault item not found');
    }

    if (vault.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    const updated = await this.prisma.vault.update({
      where: { id },
      data: {
        ...dto,
        expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : undefined,
      },
    });

    return this.mapVault(updated);
  }

  async remove(userId: string, id: string): Promise<void> {
    const vault = await this.prisma.vault.findUnique({ where: { id } });

    if (!vault) {
      throw new NotFoundException('Vault item not found');
    }

    if (vault.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    await this.prisma.vault.delete({ where: { id } });
  }

  private mapVault(vault: {
    id: string;
    userId: string;
    contentUrl: string;
    tags: string | null;
    expiryDate: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }): IVault {
    return {
      id: vault.id,
      userId: vault.userId,
      contentUrl: vault.contentUrl,
      tags: vault.tags,
      expiryDate: vault.expiryDate?.toISOString() ?? null,
      createdAt: vault.createdAt.toISOString(),
      updatedAt: vault.updatedAt.toISOString(),
    };
  }
}
