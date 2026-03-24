import { Controller, Get, Post, Patch, Delete, Param, Body } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AccountsService } from './accounts.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';

@ApiTags('Accounts')
@Controller('accounts')
export class AccountsController {
  constructor(private accountsService: AccountsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new account' })
  create(@Body() dto: CreateAccountDto) {
    return this.accountsService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all accounts' })
  findAll() {
    return this.accountsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an account by ID' })
  findOne(@Param('id') id: string) {
    return this.accountsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an account' })
  update(@Param('id') id: string, @Body() dto: UpdateAccountDto) {
    return this.accountsService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an account' })
  remove(@Param('id') id: string) {
    return this.accountsService.remove(id);
  }
}
