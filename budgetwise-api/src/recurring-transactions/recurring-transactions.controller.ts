import { Controller, Get, Post, Patch, Delete, Body, Param, HttpCode } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { RecurringTransactionsService } from './recurring-transactions.service';
import { CreateRecurringTransactionDto } from './dto/create-recurring-transaction.dto';
import { UpdateRecurringTransactionDto } from './dto/update-recurring-transaction.dto';
import { CurrentUser } from '../auth/current-user.decorator';

@ApiTags('Recurring Transactions')
@ApiBearerAuth()
@Controller('recurring-transactions')
export class RecurringTransactionsController {
  constructor(private readonly service: RecurringTransactionsService) {}

  @Post()
  create(@CurrentUser() user: { userId: string }, @Body() dto: CreateRecurringTransactionDto) {
    return this.service.create(dto, user.userId);
  }

  @Get()
  findAll(@CurrentUser() user: { userId: string }) {
    return this.service.findAll(user.userId);
  }

  @Get(':id')
  findOne(@CurrentUser() user: { userId: string }, @Param('id') id: string) {
    return this.service.findOne(id, user.userId);
  }

  @Patch(':id')
  update(@CurrentUser() user: { userId: string }, @Param('id') id: string, @Body() dto: UpdateRecurringTransactionDto) {
    return this.service.update(id, dto, user.userId);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@CurrentUser() user: { userId: string }, @Param('id') id: string) {
    return this.service.remove(id, user.userId);
  }

  @Post(':id/generate')
  generate(@CurrentUser() user: { userId: string }, @Param('id') id: string) {
    return this.service.generate(id, user.userId);
  }
}
