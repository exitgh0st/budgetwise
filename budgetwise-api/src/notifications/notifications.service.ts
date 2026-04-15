import { Injectable, NotFoundException } from '@nestjs/common';
import {
  Notification,
  NotificationType,
  ScheduledTransaction,
  TransactionType,
} from '@prisma/client';
import {
  differenceInLocalCalendarDays,
  startOfLocalDay,
} from '../common/date.util';
import { PrismaService } from '../prisma/prisma.service';
import { formatCurrencyAmount } from '../user/currency.constants';
import { UserService } from '../user/user.service';

@Injectable()
export class NotificationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly userService: UserService,
  ) {}

  async listForUser(
    userId: string,
    skip = 0,
    take = 20,
  ): Promise<Notification[]> {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    });
  }

  async unreadCount(userId: string): Promise<number> {
    return this.prisma.notification.count({
      where: { userId, isRead: false },
    });
  }

  async markRead(userId: string, id: string): Promise<Notification> {
    const notification = await this.prisma.notification.findFirst({
      where: { id, userId },
    });

    if (!notification) {
      throw new NotFoundException(`Notification ${id} not found`);
    }

    if (notification.isRead) {
      return notification;
    }

    return this.prisma.notification.update({
      where: { id },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });
  }

  async markAllRead(userId: string): Promise<{ updated: number }> {
    const result = await this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    return { updated: result.count };
  }

  async dismiss(userId: string, id: string): Promise<void> {
    const notification = await this.prisma.notification.findFirst({
      where: { id, userId },
    });

    if (!notification) {
      throw new NotFoundException(`Notification ${id} not found`);
    }

    await this.prisma.notification.delete({ where: { id } });
  }

  async markReadByScheduledTx(
    scheduledTransactionId: string,
  ): Promise<{ updated: number }> {
    const result = await this.prisma.notification.updateMany({
      where: {
        scheduledTransactionId,
        type: NotificationType.SCHEDULED_TX_DUE,
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    return { updated: result.count };
  }

  async createForScheduledTx(
    scheduledTransaction: Pick<
      ScheduledTransaction,
      | 'id'
      | 'userId'
      | 'description'
      | 'amount'
      | 'nextDueDate'
      | 'type'
      | 'notifyDaysBefore'
    >,
  ): Promise<void> {
    if (
      !scheduledTransaction.userId ||
      scheduledTransaction.notifyDaysBefore === null
    ) {
      return;
    }

    const startOfToday = startOfLocalDay(new Date());

    const existing = await this.prisma.notification.findFirst({
      where: {
        scheduledTransactionId: scheduledTransaction.id,
        type: NotificationType.SCHEDULED_TX_DUE,
        isRead: false,
        createdAt: { gte: startOfToday },
      },
    });

    if (existing) {
      return;
    }

    const daysUntilDue = Math.max(
      0,
      differenceInLocalCalendarDays(
        startOfToday,
        scheduledTransaction.nextDueDate,
      ),
    );
    const label =
      scheduledTransaction.type === TransactionType.INCOME
        ? 'income'
        : 'expense';
    const currencyCode = await this.userService.getCurrencyCode(
      scheduledTransaction.userId,
    );

    await this.prisma.notification.create({
      data: {
        userId: scheduledTransaction.userId,
        scheduledTransactionId: scheduledTransaction.id,
        type: NotificationType.SCHEDULED_TX_DUE,
        title: `Upcoming ${label}: ${scheduledTransaction.description ?? '(no description)'}`,
        body: `Due in ${daysUntilDue} day(s) - ${formatCurrencyAmount(Number(scheduledTransaction.amount), currencyCode)}`,
      },
    });
  }
}
