import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { CacheService } from '@/common/cache/cache.service';
import { subconverterConfig } from '@/config/subconverter.config';
import { ConfigTargetType } from '@subgate/types';

const CACHE_PREFIX = 'generated_sub:';

export interface GenerationResult {
  uuid: string;
  content: string;
  expiresAt: string;
}

@Injectable()
export class ConverterService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
  ) {}

  async generate(
    userId: string,
    sourceIds: string[],
    target: ConfigTargetType,
  ): Promise<GenerationResult> {
    if (sourceIds.length === 0) {
      throw new BadRequestException('At least one source is required');
    }

    const sources = await this.prisma.source.findMany({
      where: { id: { in: sourceIds }, userId },
    });

    if (sources.length !== sourceIds.length) {
      throw new BadRequestException('Some sources not found or not owned by you');
    }

    const cacheKey = CACHE_PREFIX + `${userId}:${sourceIds.sort().join(',')}:${target}`;
    const cached = await this.cache.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    const content = await this.callSubconverter(
      sources.map((s) => s.url),
      target,
    );

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + subconverterConfig.hostTtlDays);

    const record = await this.prisma.generatedConfig.create({
      data: {
        userId,
        targetType: target,
        content,
        expiresAt,
      },
    });

    const result: GenerationResult = {
      uuid: record.id,
      content,
      expiresAt: expiresAt.toISOString(),
    };

    await this.cache.set(cacheKey, JSON.stringify(result), subconverterConfig.cacheTtlSeconds);

    return result;
  }

  async getHostedSub(uuid: string): Promise<string> {
    const record = await this.prisma.generatedConfig.findUnique({ where: { id: uuid } });

    if (!record) {
      throw new NotFoundException('Subscription not found');
    }

    if (new Date() > record.expiresAt) {
      throw new NotFoundException('Subscription has expired');
    }

    return record.content;
  }

  private async callSubconverter(urls: string[], target: string): Promise<string> {
    const params = new URLSearchParams({
      target,
      url: urls.join('|'),
      emoji: 'true',
      udp: 'true',
      tfo: 'false',
      scv: 'false',
      fdn: 'false',
    });

    const apiUrl = `${subconverterConfig.baseUrl}/sub?${params.toString()}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), subconverterConfig.timeout);

    try {
      const response = await fetch(apiUrl, { signal: controller.signal });

      if (!response.ok) {
        throw new Error(`Subconverter returned ${response.status}: ${await response.text()}`);
      }

      return await response.text();
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        throw new Error('Subconverter request timed out');
      }

      // fallback: return a basic merged profile when subconverter is unavailable
      return this.generateFallback(urls, target);
    } finally {
      clearTimeout(timeoutId);
    }
  }

  private generateFallback(urls: string[], target: string): string {
    const header =
      target === 'clash'
        ? `# Clash Meta Profile\n# Generated: ${new Date().toISOString()}\n\nmixed-port: 7890\nallow-lan: true\nmode: rule\nlog-level: info\n\ndns:\n  enable: true\n  enhanced-mode: fake-ip\n\nproxies:\n`
        : `# ${target} Profile\n# Generated: ${new Date().toISOString()}\n\n`;

    const body = urls
      .map(
        (url, i) => `# Source ${i + 1}: ${url}\n# (Subconverter unavailable — direct proxy list)\n`,
      )
      .join('\n');

    return header + body;
  }
}
