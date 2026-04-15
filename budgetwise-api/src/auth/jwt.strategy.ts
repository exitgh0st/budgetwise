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

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(config: ConfigService) {
    const supabaseUrl = config.get<string>('SUPABASE_URL') as string;
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

  validate(payload: SupabaseJwtPayload) {
    console.log('Validating JWT payload:', payload);

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
