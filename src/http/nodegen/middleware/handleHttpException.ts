import * as express from 'express';
import { HttpException } from '../errors';
import NodegenRequest from '../interfaces/NodegenRequest';
import { createHttpExceptionFromErr } from '@/http/nodegen/utils/createHttpExceptionFromErr';

/**
 * Http Exception handler
 */
export default () => (err: any, req: NodegenRequest, res: express.Response, next: express.NextFunction) => {
  if (err.stack) {
    console.error(err.stack);
  } else {
    console.error(err);
  }

  if (!(err instanceof HttpException)) {
    err = createHttpExceptionFromErr(err);
  }

  return res.status(err.status).json(err);
};
