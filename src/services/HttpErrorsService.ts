import { HttpException } from '@/http/nodegen/errors';

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
    return exception;
  }
}
