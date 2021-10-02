import config from '@/config';
import { HttpException, UnprocessableEntityException } from '@/http/nodegen/errors';
import { CelebrateError, isCelebrateError } from 'celebrate';

export const createHttpExceptionFromErr = (
  error: Error | CelebrateError,
  options?: { status?: number; body?: Record<string, any> }
): HttpException => {
  if (isCelebrateError(error)) {
    // TODO: parse into something normal
    return new UnprocessableEntityException(Object.fromEntries(error.details));
  }

  const httpException = new HttpException(options?.status ?? 500, options?.body ?? error.message);
  httpException.message = error.name;

  if (config.env !== 'production') {
    httpException.stack = error?.stack;
  }

  return httpException;
};
