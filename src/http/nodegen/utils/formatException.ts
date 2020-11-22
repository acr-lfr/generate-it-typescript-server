import { HttpException } from '@/http/nodegen/errors';

/**
 * Parse and format HTTP errors
 *
 * By default the exception body is returned - just replace the body of the
 * function to return whatever you like.
 *
 * eg: return `${exception.status} ${exception.message}: ${exception.stack}`;
 */
export const formatException = (exception: HttpException): string | Record<string, any> => {
  if ((exception.body as Record<string, any>).joi) {
    return exception.body;
  }

  return exception;
};
