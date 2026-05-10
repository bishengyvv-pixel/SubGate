import { Controller, Get } from '@nestjs/common';
import { HealthService, HealthCheckResult } from './health.service';

@Controller('api/health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  async check(): Promise<HealthCheckResult> {
    return this.healthService.check();
  }
}
