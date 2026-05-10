import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';
import { redisConfig } from '@/config/redis.config';

@Injectable()
export class CacheService implements OnModuleDestroy {
  private readonly logger = new Logger(CacheService.name);
  private redis: Redis | null = null;
  private available = false;

  constructor() {
    try {
      this.redis = new Redis(redisConfig.url, {
        lazyConnect: true,
        maxRetriesPerRequest: 1,
        connectTimeout: 3000,
      });

      this.redis.on('error', (err) => {
        this.logger.warn(`Redis unavailable: ${err.message}`);
        this.available = false;
      });

      this.redis.on('connect', () => {
        this.logger.log('Redis connected');
        this.available = true;
      });
    } catch {
      this.logger.warn('Redis not configured, caching disabled');
    }
  }

  async get(key: string): Promise<string | null> {
    if (!this.available || !this.redis) return null;
    try {
      return await this.redis.get(key);
    } catch {
      return null;
    }
  }

  async set(key: string, value: string, ttlSeconds: number): Promise<void> {
    if (!this.available || !this.redis) return;
    try {
      await this.redis.set(key, value, 'EX', ttlSeconds);
    } catch {
      // silently fail
    }
  }

  async onModuleDestroy() {
    if (this.redis) {
      await this.redis.quit();
    }
  }
}
