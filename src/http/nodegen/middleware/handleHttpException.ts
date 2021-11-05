import { createHttpExceptionFromErr } from '@/http/nodegen/utils/createHttpExceptionFromErr';
import * as express from 'express';
import { HttpException } from '../errors';
import NodegenRequest from '../interfaces/NodegenRequest';
import config from '@/config';

/**
 * Http Exception handler
 */
export default () => (err: HttpException, req: NodegenRequest, res: express.Response, next: express.NextFunction) => {
  if (!(err instanceof HttpException)) {
    err = createHttpExceptionFromErr(err);
  }

  console.error(err.stack || err);

  if (err.status === 500 && config.env === 'production') {
    return res.status(err.status).json({ message: 'Internal server error' });
  } else {
    return res.status(err.status).json(err);
  }
};
