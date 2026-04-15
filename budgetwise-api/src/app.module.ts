import { randomUUID } from 'node:crypto';
import { CacheModule } from '@nestjs/cache-manager';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { SentryModule } from '@sentry/nestjs/setup';
import { LoggerModule } from 'nestjs-pino';
import type { Request, Response } from 'express';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { AccountsModule } from './accounts/accounts.module';
import { CategoriesModule } from './categories/categories.module';
import { TransactionsModule } from './transactions/transactions.module';
import { BudgetsModule } from './budgets/budgets.module';
import { ReportsModule } from './reports/reports.module';
import { ChatModule } from './chat/chat.module';
import { NotificationsModule } from './notifications/notifications.module';
import { EmailModule } from './email/email.module';
import { ScheduledTransactionsModule } from './scheduled-transactions/scheduled-transactions.module';
import { GoalsModule } from './goals/goals.module';
import { UserModule } from './user/user.module';
import { HealthModule } from './health/health.module';

const isProduction = process.env.NODE_ENV === 'production';
const defaultLogLevel = isProduction ? 'info' : 'debug';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    CacheModule.register({
      isGlobal: true,
      ttl: 300000,
    }),
    LoggerModule.forRoot({
      pinoHttp: {
        level: process.env.LOG_LEVEL ?? defaultLogLevel,
        transport: isProduction
          ? undefined
          : {
              target: 'pino-pretty',
              options: {
                singleLine: true,
                translateTime: 'SYS:standard',
                ignore: 'pid,hostname',
              },
            },
        genReqId: (request: Request, response: Response) => {
          const headerValue = request.headers['x-request-id'];
          const requestId = Array.isArray(headerValue)
            ? headerValue[0]
            : headerValue;

          if (requestId) {
            response.setHeader('x-request-id', requestId);
            return requestId;
          }

          const generatedId = randomUUID();
          response.setHeader('x-request-id', generatedId);
          return generatedId;
        },
      },
    }),
    ...(process.env.SENTRY_DSN ? [SentryModule.forRoot()] : []),
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot({
      errorMessage: 'Too many requests. Please try again in a moment.',
      throttlers: [{ ttl: 60000, limit: 100 }],
    }),
    PrismaModule,
    AuthModule,
    AccountsModule,
    CategoriesModule,
    TransactionsModule,
    BudgetsModule,
    ReportsModule,
    ChatModule,
    NotificationsModule,
    EmailModule,
    ScheduledTransactionsModule,
    GoalsModule,
    UserModule,
    HealthModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
  ],
})
export class AppModule {}
