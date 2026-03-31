import { Controller, Get, Post, Patch, Delete, Param, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { BudgetsService } from './budgets.service';
import { CreateBudgetDto } from './dto/create-budget.dto';
import { UpdateBudgetDto } from './dto/update-budget.dto';
import { FilterBudgetsDto } from './dto/filter-budgets.dto';
import { CurrentUser } from '../auth/current-user.decorator';

@ApiTags('Budgets')
@ApiBearerAuth()
@Controller('budgets')
export class BudgetsController {
  constructor(private budgetsService: BudgetsService) {}

  @Post()
  @ApiOperation({ summary: 'Create or update a budget for a category/month/year' })
  create(@CurrentUser() user: { userId: string }, @Body() dto: CreateBudgetDto) {
    return this.budgetsService.create(dto, user.userId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all budgets, optionally filtered by month/year' })
  findAll(@CurrentUser() user: { userId: string }, @Query() filters: FilterBudgetsDto) {
    return this.budgetsService.findAll(filters.month, filters.year, user.userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a budget by ID' })
  findOne(@CurrentUser() user: { userId: string }, @Param('id') id: string) {
    return this.budgetsService.findOne(id, user.userId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a budget amount' })
  update(@CurrentUser() user: { userId: string }, @Param('id') id: string, @Body() dto: UpdateBudgetDto) {
    return this.budgetsService.update(id, dto, user.userId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a budget' })
  remove(@CurrentUser() user: { userId: string }, @Param('id') id: string) {
    return this.budgetsService.remove(id, user.userId);
  }
}
