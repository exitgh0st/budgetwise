import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import * as jwksRsa from 'jwks-rsa';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { normalizeCurrencyCode } from '../user/currency.constants';

type SupabaseJwtPayload = {
  sub: string;
  email: string;
  user_metadata?: {
    email_verified: boolean;
    currency?: string;
  };
};

/**
 * Validates Supabase-issued JWTs using the Supabase JWKS endpoint.
 * Fetches public keys dynamically so key rotation is handled automatically.
 * Tokens are signed with ES256 (ECDSA P-256).
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(config: ConfigService) {
    const supabaseUrl = config.getOrThrow<string>('SUPABASE_URL');
    const jwksUri = `${supabaseUrl}/auth/v1/.well-known/jwks.json`;

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKeyProvider: jwksRsa.passportJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 5,
        jwksUri,
      }),
      algorithms: ['ES256'],
    });
  }

  /**
   * Called after signature verification. Rejects unverified emails so the
   * rest of the app can assume `request.user.userId` is always a verified account.
   *
   * @returns The user object attached to `request.user` for every authenticated request
   * @throws UnauthorizedException when the user has not verified their email
   */
  validate(payload: SupabaseJwtPayload) {
    if (!payload.user_metadata?.email_verified) {
      throw new UnauthorizedException({
        statusCode: 401,
        message: 'Email not verified',
        code: 'EMAIL_NOT_VERIFIED',
      });
    }

    return {
      userId: payload.sub,
      email: payload.email,
      currency: normalizeCurrencyCode(payload.user_metadata?.currency),
    };
  }
}
