import { Module } from '@nestjs/common';
import { ConverterController } from './converter.controller';
import { ConverterService } from './converter.service';

@Module({
  controllers: [ConverterController],
  providers: [ConverterService],
})
export class ConverterModule {}
