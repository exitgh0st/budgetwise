import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ReportsService } from './reports.service';

@ApiTags('Reports')
@Controller('reports')
export class ReportsController {
  constructor(private reportsService: ReportsService) {}

  @Get('summary')
  @ApiOperation({ summary: 'Get monthly income/expense summary' })
  getSummary(@Query('month') month?: number, @Query('year') year?: number) {
    return this.reportsService.getSummary(
      month ? Number(month) : undefined,
      year ? Number(year) : undefined,
    );
  }

  @Get('spending-by-category')
  @ApiOperation({ summary: 'Get expense breakdown by category' })
  getSpendingByCategory(@Query('month') month?: number, @Query('year') year?: number) {
    return this.reportsService.getSpendingByCategory(
      month ? Number(month) : undefined,
      year ? Number(year) : undefined,
    );
  }

  @Get('budget-status')
  @ApiOperation({ summary: 'Get budget vs actual spending status' })
  getBudgetStatus(@Query('month') month?: number, @Query('year') year?: number) {
    return this.reportsService.getBudgetStatus(
      month ? Number(month) : undefined,
      year ? Number(year) : undefined,
    );
  }

  @Get('monthly-trend')
  @ApiOperation({ summary: 'Get income/expense trend over recent months' })
  getMonthlyTrend(@Query('months') months?: number) {
    return this.reportsService.getMonthlyTrend(months ? Number(months) : undefined);
  }
}
