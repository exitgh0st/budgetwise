import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { CurrentUser } from '../auth/current-user.decorator';

@ApiTags('Reports')
@ApiBearerAuth()
@Controller('reports')
export class ReportsController {
  constructor(private reportsService: ReportsService) {}

  @Get('summary')
  @ApiOperation({ summary: 'Get monthly income/expense summary' })
  getSummary(
    @CurrentUser() user: { userId: string },
    @Query('month') month?: number,
    @Query('year') year?: number,
  ) {
    return this.reportsService.getSummary(
      month ? Number(month) : undefined,
      year ? Number(year) : undefined,
      user.userId,
    );
  }

  @Get('spending-by-category')
  @ApiOperation({ summary: 'Get expense breakdown by category' })
  getSpendingByCategory(
    @CurrentUser() user: { userId: string },
    @Query('month') month?: number,
    @Query('year') year?: number,
  ) {
    return this.reportsService.getSpendingByCategory(
      month ? Number(month) : undefined,
      year ? Number(year) : undefined,
      user.userId,
    );
  }

  @Get('budget-status')
  @ApiOperation({ summary: 'Get budget vs actual spending status' })
  getBudgetStatus(
    @CurrentUser() user: { userId: string },
    @Query('month') month?: number,
    @Query('year') year?: number,
  ) {
    return this.reportsService.getBudgetStatus(
      month ? Number(month) : undefined,
      year ? Number(year) : undefined,
      user.userId,
    );
  }

  @Get('monthly-trend')
  @ApiOperation({ summary: 'Get income/expense trend over recent months' })
  getMonthlyTrend(
    @CurrentUser() user: { userId: string },
    @Query('months') months?: number,
  ) {
    return this.reportsService.getMonthlyTrend(months ? Number(months) : undefined, user.userId);
  }
}
