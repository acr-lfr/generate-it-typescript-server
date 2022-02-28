import { createHttpExceptionFromErr } from '@/http/nodegen/utils/createHttpExceptionFromErr';
import * as express from 'express';
import { HttpException } from '../errors';
import NodegenRequest from '../interfaces/NodegenRequest';
import config from '@/config';

export interface HttpExceptionOptions {
  errorHook?: (error: any) => void,
  errorLogger?: (error: any) => void,
}

/**
 * Http Exception handler
 */
export default (options: HttpExceptionOptions = {}) => {
  let errorLogger = (error: HttpException) => {
    console.error(error.stack || error);
  };

  if (typeof options.errorLogger === 'function') {
    errorLogger = options.errorLogger;
  }

  return (err: HttpException, req: NodegenRequest, res: express.Response, next: express.NextFunction) => {
    if (!(err instanceof HttpException)) {
      err = createHttpExceptionFromErr(err);
    }

    errorLogger(err);

    if (options.errorHook) {
      options.errorHook(err);
    }

    if (err.status === 500 && config.env === 'production') {
      return res.status(err.status).json({ message: 'Internal server error' });
    } else {
      return res.status(err.status).json(err);
    }
  };
};
