import { CelebrateInternalError } from 'celebrate';
import config from '@/config';
import { HttpException } from '@/http/nodegen/errors';

export const createHttpExceptionFromErr = (
  error: Error,
  options?: { status?: number; body?: Record<string, any> }
): HttpException => {
  if ((error as unknown as CelebrateInternalError).joi) {
    return new HttpException(422, error);
  }

  const body = {
    body: 'Internal server error',
    message: error?.name || error?.message,
    status: options?.status ?? 500,
    stack: config.env !== 'production' ? error?.stack : null,
    ...(options?.body || {}),
  };

  return new HttpException(body.status, body);
};
