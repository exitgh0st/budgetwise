import {
  CanActivate,
  ExecutionContext,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { timingSafeEqual } from 'crypto';

@Injectable()
export class InternalAdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const configuredSecret = process.env.INTERNAL_ADMIN_SECRET;
    if (!configuredSecret) {
      throw new InternalServerErrorException(
        'INTERNAL_ADMIN_SECRET is not configured',
      );
    }

    const request = context.switchToHttp().getRequest<{
      headers: Record<string, string | string[] | undefined>;
    }>();
    const headerValue = request.headers['x-internal-secret'];
    const providedSecret = Array.isArray(headerValue)
      ? headerValue[0]
      : headerValue;

    if (!providedSecret) {
      throw new UnauthorizedException('Missing internal secret');
    }

    const configuredBuffer = Buffer.from(configuredSecret);
    const providedBuffer = Buffer.from(providedSecret);

    if (
      configuredBuffer.length !== providedBuffer.length ||
      !timingSafeEqual(configuredBuffer, providedBuffer)
    ) {
      throw new UnauthorizedException('Invalid internal secret');
    }

    return true;
  }
}
