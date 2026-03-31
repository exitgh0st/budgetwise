import { Controller, Get, Post, Patch, Delete, Param, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AccountsService } from './accounts.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';
import { AdjustBalanceDto } from './dto/adjust-balance.dto';
import { CurrentUser } from '../auth/current-user.decorator';

@ApiTags('Accounts')
@ApiBearerAuth()
@Controller('accounts')
export class AccountsController {
  constructor(private accountsService: AccountsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new account' })
  create(@CurrentUser() user: { userId: string }, @Body() dto: CreateAccountDto) {
    return this.accountsService.create(dto, user.userId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all accounts' })
  findAll(@CurrentUser() user: { userId: string }) {
    return this.accountsService.findAll(user.userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an account by ID' })
  findOne(@CurrentUser() user: { userId: string }, @Param('id') id: string) {
    return this.accountsService.findOne(id, user.userId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an account' })
  update(@CurrentUser() user: { userId: string }, @Param('id') id: string, @Body() dto: UpdateAccountDto) {
    return this.accountsService.update(id, dto, user.userId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an account' })
  remove(@CurrentUser() user: { userId: string }, @Param('id') id: string) {
    return this.accountsService.remove(id, user.userId);
  }

  @Post(':id/adjust-balance')
  @ApiOperation({ summary: 'Adjust account balance via adjustment transaction' })
  adjustBalance(@CurrentUser() user: { userId: string }, @Param('id') id: string, @Body() dto: AdjustBalanceDto) {
    return this.accountsService.adjustBalance(id, dto.newBalance, user.userId);
  }
}
