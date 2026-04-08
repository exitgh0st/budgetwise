import {
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/current-user.decorator';
import { ListNotificationsDto } from './dto/list-notifications.dto';
import { NotificationsService } from './notifications.service';

@ApiTags('Notifications')
@ApiBearerAuth()
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  list(
    @CurrentUser() user: { userId: string },
    @Query() query: ListNotificationsDto,
  ) {
    return this.notificationsService.listForUser(
      user.userId,
      query.skip,
      query.take,
    );
  }

  @Get('unread-count')
  async unreadCount(@CurrentUser() user: { userId: string }) {
    return {
      count: await this.notificationsService.unreadCount(user.userId),
    };
  }

  @Patch(':id/read')
  markRead(@CurrentUser() user: { userId: string }, @Param('id') id: string) {
    return this.notificationsService.markRead(user.userId, id);
  }

  @Patch('read-all')
  markAllRead(@CurrentUser() user: { userId: string }) {
    return this.notificationsService.markAllRead(user.userId);
  }

  @Delete(':id')
  @HttpCode(204)
  dismiss(@CurrentUser() user: { userId: string }, @Param('id') id: string) {
    return this.notificationsService.dismiss(user.userId, id);
  }
}
