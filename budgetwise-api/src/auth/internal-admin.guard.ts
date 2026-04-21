import {
  CanActivate,
  ExecutionContext,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { timingSafeEqual } from 'crypto';

/**
 * Protects internal-only endpoints (e.g. cron triggers) using a shared secret
 * passed in the `x-internal-secret` request header.
 *
 * `timingSafeEqual` is used for comparison to prevent timing-based secret
 * enumeration attacks that a simple `===` comparison would allow.
 */
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
    // Take the first value when the header appears multiple times
    const providedSecret = Array.isArray(headerValue)
      ? headerValue[0]
      : headerValue;

    if (!providedSecret) {
      throw new UnauthorizedException('Missing internal secret');
    }

    const configuredBuffer = Buffer.from(configuredSecret);
    const providedBuffer = Buffer.from(providedSecret);

    // Length must be equal before calling timingSafeEqual (it throws on mismatch)
    if (
      configuredBuffer.length !== providedBuffer.length ||
      !timingSafeEqual(configuredBuffer, providedBuffer)
    ) {
      throw new UnauthorizedException('Invalid internal secret');
    }

    return true;
  }
}
