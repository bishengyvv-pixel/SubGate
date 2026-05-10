import { Module } from '@nestjs/common';
import { SourcesController } from './sources.controller';
import { SourcesService } from './sources.service';
import { SourcesHealthService } from './sources-health.service';

@Module({
  controllers: [SourcesController],
  providers: [SourcesService, SourcesHealthService],
})
export class SourcesModule {}
