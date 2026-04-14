import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import * as jwksRsa from 'jwks-rsa';
import { ExtractJwt, Strategy } from 'passport-jwt';

type SupabaseJwtPayload = {
  sub: string;
  email: string;
  email_confirmed_at?: string | null;
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
    if (!payload.email_confirmed_at) {
      throw new UnauthorizedException({
        statusCode: 401,
        message: 'Email not verified',
        code: 'EMAIL_NOT_VERIFIED',
      });
    }

    return { userId: payload.sub, email: payload.email };
  }
}
