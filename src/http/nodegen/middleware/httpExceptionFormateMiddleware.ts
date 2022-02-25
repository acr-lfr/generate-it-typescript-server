import { createHttpExceptionFromErr } from '@/http/nodegen/utils/createHttpExceptionFromErr';
import * as express from 'express';
import { HttpException } from '../errors';
import NodegenRequest from '../interfaces/NodegenRequest';

/**
 * Http Exception handler
 */
export default (err: HttpException, req: NodegenRequest, res: express.Response, next: express.NextFunction) => {
  if (!(err instanceof HttpException)) {
    err = createHttpExceptionFromErr(err);
  }

  return next(err);
}
