import { HttpException, UnprocessableEntityException } from '@/http/nodegen/errors';
import { CelebrateError, isCelebrateError } from 'celebrate';

export const createHttpExceptionFromErr = (
  error: Error | CelebrateError | HttpException,
  options?: { status?: number; body?: Record<string, any> }
): HttpException => {
  if (error instanceof HttpException) {
    return error;
  }

  let httpException: HttpException;
  if (isCelebrateError(error)) {
    // TODO: parse into something normal
    httpException = new UnprocessableEntityException(Object.fromEntries(error.details));
  } else {
    httpException = new HttpException(options?.status ?? 500, options?.body ?? error.message);
  }

  httpException.message = error.message;
  httpException.stack = error.stack;

  return httpException;
};
