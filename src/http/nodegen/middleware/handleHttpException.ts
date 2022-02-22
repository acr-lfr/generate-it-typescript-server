import { createHttpExceptionFromErr } from '@/http/nodegen/utils/createHttpExceptionFromErr';
import * as express from 'express';
import { HttpException } from '../errors';
import NodegenRequest from '../interfaces/NodegenRequest';
import config from '@/config';

export interface HandleExceptionInjection {
  handle500?: (err: HttpException) => void;
}

/**
 * Http Exception handler
 */
export default (handleExceptionInjection: HandleExceptionInjection = {}) => {
  return (err: HttpException, req: NodegenRequest, res: express.Response) => {
    if (!(err instanceof HttpException)) {
      err = createHttpExceptionFromErr(err);
    }

    console.error(err.stack || err);

    if (err.status === 500 && handleExceptionInjection.handle500) {
      handleExceptionInjection.handle500(err);
    }

    if (err.status === 500 && config.env === 'production') {
      return res.status(err.status).json({ message: 'Internal server error' });
    } else {
      return res.status(err.status).json(err);
    }
  };
}
