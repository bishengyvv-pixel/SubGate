import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';

export interface HealthCheckResult {
  status: 'ok' | 'error';
  timestamp: string;
  database: {
    status: 'ok' | 'error';
    message?: string;
  };
}

@Injectable()
export class HealthService {
  constructor(private readonly prisma: PrismaService) {}

  async check(): Promise<HealthCheckResult> {
    const result: HealthCheckResult = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: { status: 'ok' },
    };

    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch (error) {
      result.status = 'error';
      result.database = {
        status: 'error',
        message: error instanceof Error ? error.message : 'Database connection failed',
      };
    }

    return result;
  }
}
