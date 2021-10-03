import * as express from 'express';
import { HttpException } from '../errors';
import NodegenRequest from '../interfaces/NodegenRequest';
import { createHttpExceptionFromErr } from '@/http/nodegen/utils/createHttpExceptionFromErr';
import { LoggerService } from '@/services';

/**
 * Http Exception handler
 */
export default () => (err: HttpException, req: NodegenRequest, res: express.Response, next: express.NextFunction) => {
  if (!(err instanceof HttpException)) {
    err = createHttpExceptionFromErr(err);
  }

  LoggerService.error(err);

  return res.status(err.status).json(err);
};
