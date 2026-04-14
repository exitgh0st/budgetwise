import { Controller, Delete, Get, HttpCode, Res } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { CurrentUser } from '../auth/current-user.decorator';
import { UserService } from './user.service';

@ApiTags('User')
@ApiBearerAuth()
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

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
