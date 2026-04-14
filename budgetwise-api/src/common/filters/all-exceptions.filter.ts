import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const isProd = process.env.NODE_ENV === 'production';

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const body = exception.getResponse();

      this.logger.warn(
        `HttpException ${status}: ${typeof body === 'string' ? body : JSON.stringify(body)}`,
      );
      if (exception.stack) {
        this.logger.warn(exception.stack);
      }

      response.status(status).json(
        typeof body === 'string'
          ? {
              statusCode: status,
              message: body,
            }
          : body,
      );
      return;
    }

    const errorMessage =
      exception instanceof Error ? exception.message : String(exception);
    const errorStack = exception instanceof Error ? exception.stack : undefined;

    this.logger.error('Unhandled exception', errorStack ?? errorMessage);

    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json(
      isProd
        ? {
            statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
            message: 'Internal server error',
          }
        : {
            statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
            message: errorMessage,
            ...(errorStack ? { stack: errorStack } : {}),
          },
    );
  }
}
