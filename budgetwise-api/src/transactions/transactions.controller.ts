import { Controller, Get, Post, Patch, Delete, Param, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { FilterTransactionsDto } from './dto/filter-transactions.dto';
import { CurrentUser } from '../auth/current-user.decorator';

@ApiTags('Transactions')
@ApiBearerAuth()
@Controller('transactions')
export class TransactionsController {
  constructor(private transactionsService: TransactionsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a transaction and update account balance' })
  create(@CurrentUser() user: { userId: string }, @Body() dto: CreateTransactionDto) {
    return this.transactionsService.create(dto, user.userId);
  }

  @Get()
  @ApiOperation({ summary: 'Get transactions with filters and pagination' })
  findAll(@CurrentUser() user: { userId: string }, @Query() filters: FilterTransactionsDto) {
    return this.transactionsService.findAll(filters, user.userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a transaction by ID' })
  findOne(@CurrentUser() user: { userId: string }, @Param('id') id: string) {
    return this.transactionsService.findOne(id, user.userId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a transaction and adjust account balances' })
  update(@CurrentUser() user: { userId: string }, @Param('id') id: string, @Body() dto: UpdateTransactionDto) {
    return this.transactionsService.update(id, dto, user.userId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a transaction and reverse account balance' })
  remove(@CurrentUser() user: { userId: string }, @Param('id') id: string) {
    return this.transactionsService.remove(id, user.userId);
  }
}
