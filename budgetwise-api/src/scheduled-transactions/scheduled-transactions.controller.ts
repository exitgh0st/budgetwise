import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  HttpCode,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ScheduledTransactionsService } from './scheduled-transactions.service';
import { ScheduledTransactionsCronService } from './scheduled-transactions-cron.service';
import { CreateScheduledTransactionDto } from './dto/create-scheduled-transaction.dto';
import { UpdateScheduledTransactionDto } from './dto/update-scheduled-transaction.dto';
import { CurrentUser } from '../auth/current-user.decorator';
import { Public } from '../auth/public.decorator';

@ApiTags('Scheduled Transactions')
@ApiBearerAuth()
@Controller('scheduled-transactions')
export class ScheduledTransactionsController {
  constructor(
    private readonly service: ScheduledTransactionsService,
    private readonly cronService: ScheduledTransactionsCronService,
  ) {}

  @Post()
  create(
    @CurrentUser() user: { userId: string },
    @Body() dto: CreateScheduledTransactionDto,
  ) {
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
  update(
    @CurrentUser() user: { userId: string },
    @Param('id') id: string,
    @Body() dto: UpdateScheduledTransactionDto,
  ) {
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

  @Public()
  @Post('process-due')
  processDue() {
    return this.cronService.processDueTransactions();
  }
}
