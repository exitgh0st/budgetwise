import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Route handler parameter decorator that extracts `request.user` — the
 * object returned by `JwtStrategy.validate()` after successful JWT verification.
 */
export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
