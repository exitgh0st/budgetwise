import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Patch,
  Res,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { CurrentUser } from '../auth/current-user.decorator';
import { UpdateUserPreferencesDto } from './dto/update-user-preferences.dto';
import { UserService } from './user.service';

@ApiTags('User')
@ApiBearerAuth()
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('preferences')
  @ApiOperation({ summary: 'Get the current user preferences' })
  getPreferences(
    @CurrentUser() user: { userId: string; currency?: string },
  ): Promise<{ currency: string }> {
    return this.userService.getPreferences(user.userId, user.currency);
  }

  @Patch('preferences')
  @ApiOperation({ summary: 'Update the current user preferences' })
  updatePreferences(
    @CurrentUser() user: { userId: string },
    @Body() dto: UpdateUserPreferencesDto,
  ): Promise<{ currency: string }> {
    return this.userService.updatePreferences(user.userId, dto);
  }

  @Get('export')
  @ApiOperation({ summary: 'Export all user data as JSON' })
  async exportData(
    @CurrentUser() user: { userId: string },
    @Res() res: Response,
  ): Promise<void> {
    const data = await this.userService.exportData(user.userId);
    const filename = `budgetwise-export-${new Date().toISOString().split('T')[0]}.json`;

    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    res.status(200).send(JSON.stringify(data, null, 2));
  }

  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @Delete()
  @HttpCode(204)
  @ApiOperation({ summary: 'Permanently delete user account and all data' })
  async deleteAccount(@CurrentUser() user: { userId: string }): Promise<void> {
    await this.userService.deleteAccount(user.userId);
  }
}
