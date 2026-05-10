import { Injectable, NotFoundException, ForbiddenException, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateConfigDto } from './dto/create-config.dto';
import { UpdateConfigDto } from './dto/update-config.dto';
import { IConfig } from '@subgate/types';

const PRESET_TEMPLATES: Omit<CreateConfigDto, 'targetType'>[] = [
  {
    templateName: '基础分流',
    customRules:
      '# 基础规则\n# 国内流量直连\nDOMAIN-SUFFIX,cn,DIRECT\n# 海外流量代理\nGEOIP,CN,DIRECT\nMATCH,PROXY',
  },
  {
    templateName: '全能拦截',
    customRules:
      '# 全能拦截规则\n# 广告拦截\nDOMAIN-KEYWORD,ad,REJECT\n# 隐私保护\nDOMAIN-SUFFIX,doubleclick.net,REJECT\nMATCH,PROXY',
  },
  {
    templateName: 'AI 优先',
    customRules:
      '# AI 优先规则\n# AI 服务走专用节点\nDOMAIN-SUFFIX,openai.com,AI\nDOMAIN-SUFFIX,anthropic.com,AI\nMATCH,PROXY',
  },
];

@Injectable()
export class ConfigsService implements OnModuleInit {
  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    await this.seedPresets();
  }

  private async seedPresets() {
    const users = await this.prisma.user.findMany({ take: 1 });
    if (users.length === 0) return;

    const userId = users[0].id;
    for (const preset of PRESET_TEMPLATES) {
      const existing = await this.prisma.config.findFirst({
        where: { templateName: preset.templateName, userId },
      });
      if (!existing) {
        await this.prisma.config.create({
          data: { ...preset, userId, targetType: 'clash' },
        });
      }
    }
  }

  async findAll(userId: string): Promise<IConfig[]> {
    const configs = await this.prisma.config.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return configs.map(this.mapConfig);
  }

  async findById(userId: string, id: string): Promise<IConfig> {
    const config = await this.prisma.config.findUnique({ where: { id } });

    if (!config) {
      throw new NotFoundException('Config not found');
    }

    if (config.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    return this.mapConfig(config);
  }

  async create(userId: string, dto: CreateConfigDto): Promise<IConfig> {
    const config = await this.prisma.config.create({
      data: { ...dto, userId },
    });

    return this.mapConfig(config);
  }

  async update(userId: string, id: string, dto: UpdateConfigDto): Promise<IConfig> {
    const config = await this.prisma.config.findUnique({ where: { id } });

    if (!config) {
      throw new NotFoundException('Config not found');
    }

    if (config.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    const updated = await this.prisma.config.update({
      where: { id },
      data: dto,
    });

    return this.mapConfig(updated);
  }

  async remove(userId: string, id: string): Promise<void> {
    const config = await this.prisma.config.findUnique({ where: { id } });

    if (!config) {
      throw new NotFoundException('Config not found');
    }

    if (config.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    await this.prisma.config.delete({ where: { id } });
  }

  private mapConfig(config: {
    id: string;
    userId: string;
    templateName: string;
    customRules: string | null;
    targetType: string;
    createdAt: Date;
    updatedAt: Date;
  }): IConfig {
    return {
      id: config.id,
      userId: config.userId,
      templateName: config.templateName,
      customRules: config.customRules,
      targetType: config.targetType as IConfig['targetType'],
      createdAt: config.createdAt.toISOString(),
      updatedAt: config.updatedAt.toISOString(),
    };
  }
}
