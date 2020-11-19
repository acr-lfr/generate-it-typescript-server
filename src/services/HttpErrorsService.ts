import { HttpException } from '@/http/nodegen/errors';
import { CelebrateInternalError } from 'celebrate';

export class HttpErrorsService {
  /**
   * Parse and format HTTP errors
   *
   * By default the exception body is returned - just replace the body of the
   * function to return whatever you like.
   *
   * eg: return `${exception.status} ${exception.message}: ${exception.stack}`;
   */
  public static formatException(exception: HttpException): string | Record<string, any> {
    if ((exception.body as Record<string, any>).joi) {
      return exception.body;
    }

    return exception;
  }

  public static fromError(
    error: Error,
    options?: { status?: number; body?: Record<string, any> }
  ): HttpException {
    if ((error as unknown as CelebrateInternalError).joi) {
      return new HttpException(422, error);
    }

    const body = {
      body: 'Internal server error',
      message: error?.name || error?.message,
      status: options?.status ?? 500,
      stack: ['development', 'test'].includes(process.env.NODE_ENV) && error?.stack,
      ...(options?.body || {}),
    };

    return new HttpException(body.status, body);
  }
}
