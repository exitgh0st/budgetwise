import { Controller, Get, Post, Patch, Delete, Body, Param, HttpCode } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { BillsService } from './bills.service';
import { BillsCronService } from './bills-cron.service';
import { CreateBillDto } from './dto/create-bill.dto';
import { UpdateBillDto } from './dto/update-bill.dto';
import { CurrentUser } from '../auth/current-user.decorator';
import { Public } from '../auth/public.decorator';

@ApiTags('Bills')
@ApiBearerAuth()
@Controller('bills')
export class BillsController {
  constructor(
    private readonly service: BillsService,
    private readonly cronService: BillsCronService,
  ) {}

  @Post()
  create(@CurrentUser() user: { userId: string }, @Body() dto: CreateBillDto) {
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
  update(@CurrentUser() user: { userId: string }, @Param('id') id: string, @Body() dto: UpdateBillDto) {
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
