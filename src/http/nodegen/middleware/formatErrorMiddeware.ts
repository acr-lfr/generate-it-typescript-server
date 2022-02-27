import { HttpException } from '@/http/nodegen/errors';
import NodegenRequest from '@/http/nodegen/interfaces/NodegenRequest';
import * as express from 'express';
import { createHttpExceptionFromErr } from '@/http/nodegen/utils/createHttpExceptionFromErr';

export default (err: HttpException, req: NodegenRequest, res: express.Response, next: express.NextFunction) => {
  if (!(err instanceof HttpException)) {
    err = createHttpExceptionFromErr(err);
  }
  return next(err);
}
