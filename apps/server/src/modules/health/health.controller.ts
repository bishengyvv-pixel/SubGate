import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { HealthService, HealthCheckResult } from './health.service';

@ApiTags('Health')
@Controller('api/health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @ApiOperation({ summary: '服务健康检查（含数据库连接检测）' })
  async check(): Promise<HealthCheckResult> {
    return this.healthService.check();
  }
}
