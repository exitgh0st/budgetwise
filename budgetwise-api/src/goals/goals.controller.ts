import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/current-user.decorator';
import { ContributeGoalDto } from './dto/contribute-goal.dto';
import { CreateGoalDto } from './dto/create-goal.dto';
import { UpdateGoalDto } from './dto/update-goal.dto';
import { GoalsService } from './goals.service';

@ApiTags('Goals')
@ApiBearerAuth()
@Controller('goals')
export class GoalsController {
  constructor(private readonly goalsService: GoalsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a financial goal' })
  create(@CurrentUser() user: { userId: string }, @Body() dto: CreateGoalDto) {
    return this.goalsService.create(dto, user.userId);
  }

  @Get()
  @ApiOperation({ summary: 'List all financial goals for the current user' })
  findAll(@CurrentUser() user: { userId: string }) {
    return this.goalsService.findAll(user.userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single financial goal' })
  findOne(@CurrentUser() user: { userId: string }, @Param('id') id: string) {
    return this.goalsService.findOne(id, user.userId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a financial goal' })
  update(
    @CurrentUser() user: { userId: string },
    @Param('id') id: string,
    @Body() dto: UpdateGoalDto,
  ) {
    return this.goalsService.update(id, dto, user.userId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a financial goal' })
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@CurrentUser() user: { userId: string }, @Param('id') id: string) {
    return this.goalsService.remove(id, user.userId);
  }

  @Post(':id/contribute')
  @ApiOperation({ summary: 'Add a contribution to a financial goal' })
  contribute(
    @CurrentUser() user: { userId: string },
    @Param('id') id: string,
    @Body() dto: ContributeGoalDto,
  ) {
    return this.goalsService.contribute(id, dto, user.userId);
  }
}
