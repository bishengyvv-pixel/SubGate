import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import * as http from 'http';
import * as https from 'https';
import { PrismaService } from '@/prisma/prisma.service';
import { CacheService } from '@/common/cache/cache.service';

const HEALTH_CACHE_TTL = 300; // 5 minutes
const HEALTH_CACHE_PREFIX = 'source_health:';
const HTTP_TIMEOUT = 10000; // 10 seconds

interface HealthResult {
  isOnline: boolean;
  latency: number;
}

@Injectable()
export class SourcesHealthService {
  private readonly logger = new Logger(SourcesHealthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
  ) {}

  @Cron(CronExpression.EVERY_30_MINUTES)
  async scheduledCheck() {
    this.logger.log('Starting scheduled health check for all active sources');
    const sources = await this.prisma.source.findMany({
      where: { isActive: true },
    });

    for (const source of sources) {
      try {
        const result = await this.checkUrl(source.url);
        await this.prisma.source.update({
          where: { id: source.id },
          data: {
            isOnline: result.isOnline,
            lastCheckedAt: new Date(),
          },
        });
        this.logger.log(
          `Source "${source.name}" is ${result.isOnline ? 'online' : 'offline'} (${result.latency}ms)`,
        );
      } catch (error) {
        this.logger.error(`Failed to check source "${source.name}": ${(error as Error).message}`);
      }
    }
    this.logger.log('Scheduled health check completed');
  }

  async checkSource(url: string): Promise<HealthResult> {
    const cached = await this.cache.get(HEALTH_CACHE_PREFIX + url);
    if (cached) {
      return JSON.parse(cached);
    }

    const result = await this.checkUrl(url);
    await this.cache.set(HEALTH_CACHE_PREFIX + url, JSON.stringify(result), HEALTH_CACHE_TTL);
    return result;
  }

  private checkUrl(url: string): Promise<HealthResult> {
    return new Promise((resolve) => {
      const client = url.startsWith('https') ? https : http;
      const start = Date.now();

      const req = client.request(url, { method: 'HEAD', timeout: HTTP_TIMEOUT }, (res) => {
        const latency = Date.now() - start;
        res.resume();
        resolve({ isOnline: res.statusCode !== undefined && res.statusCode < 500, latency });
      });

      req.on('timeout', () => {
        req.destroy();
        resolve({ isOnline: false, latency: HTTP_TIMEOUT });
      });

      req.on('error', () => {
        resolve({ isOnline: false, latency: Date.now() - start });
      });

      req.end();
    });
  }
}
