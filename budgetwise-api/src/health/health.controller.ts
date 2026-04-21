import { Controller, Get, HttpStatus, Res } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { Public } from '../auth/public.decorator';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  // @Public() — no auth required so load balancers and uptime monitors can probe without a JWT.
  @Public()
  @Get()
  @ApiOperation({ summary: 'Health check' })
  // passthrough: true lets NestJS serialise the return value while still allowing manual status override on failure.
  async check(@Res({ passthrough: true }) response: Response) {
    const timestamp = new Date().toISOString();

    try {
      await this.prisma.$queryRaw`SELECT 1`;

      return {
        status: 'ok',
        database: 'connected',
        timestamp,
      };
    } catch {
      response.status(HttpStatus.SERVICE_UNAVAILABLE);

      return {
        status: 'error',
        database: 'disconnected',
        timestamp,
      };
    }
  }
}
