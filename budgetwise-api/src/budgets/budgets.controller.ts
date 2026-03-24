import { Controller, Get, Post, Patch, Delete, Param, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { BudgetsService } from './budgets.service';
import { CreateBudgetDto } from './dto/create-budget.dto';
import { UpdateBudgetDto } from './dto/update-budget.dto';
import { FilterBudgetsDto } from './dto/filter-budgets.dto';

@ApiTags('Budgets')
@Controller('budgets')
export class BudgetsController {
  constructor(private budgetsService: BudgetsService) {}

  @Post()
  @ApiOperation({ summary: 'Create or update a budget for a category/month/year' })
  create(@Body() dto: CreateBudgetDto) {
    return this.budgetsService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all budgets, optionally filtered by month/year' })
  findAll(@Query() filters: FilterBudgetsDto) {
    return this.budgetsService.findAll(filters.month, filters.year);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a budget by ID' })
  findOne(@Param('id') id: string) {
    return this.budgetsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a budget amount' })
  update(@Param('id') id: string, @Body() dto: UpdateBudgetDto) {
    return this.budgetsService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a budget' })
  remove(@Param('id') id: string) {
    return this.budgetsService.remove(id);
  }
}
