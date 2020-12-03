import * as express from 'express';
import { HttpException } from '../errors';
import NodegenRequest from '../interfaces/NodegenRequest';
import { createHttpExceptionFromErr } from '@/http/nodegen/utils/createHttpExceptionFromErr';

/**
 * Http Exception handler
 */
export default () => (err: any, req: NodegenRequest, res: express.Response, next: express.NextFunction) => {
  console.error(err);

  if (!(err instanceof HttpException)) {
    err = createHttpExceptionFromErr(err);
  }

  if (err.isJson()) {
    return res.status(err.status).json(err.body);
  } else {
    return res.status(err.status).send(err.body);
  }
};
