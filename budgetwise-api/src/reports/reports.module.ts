import { Module } from '@nestjs/common';
import { ReportCacheService } from './report-cache.service';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';

@Module({
  controllers: [ReportsController],
  providers: [ReportCacheService, ReportsService],
  exports: [ReportCacheService, ReportsService],
})
export class ReportsModule {}
