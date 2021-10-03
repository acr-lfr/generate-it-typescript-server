import { createHttpExceptionFromErr } from '@/http/nodegen/utils/createHttpExceptionFromErr';
import { LoggingService } from '@/services/LoggingService';
import * as express from 'express';
import { HttpException } from '../errors';
import NodegenRequest from '../interfaces/NodegenRequest';

/**
 * Http Exception handler
 */
export default () => (err: HttpException, req: NodegenRequest, res: express.Response, next: express.NextFunction) => {
  if (!(err instanceof HttpException)) {
    err = createHttpExceptionFromErr(err);
  }

  LoggingService.error(err.stack || err);

  return res.status(err.status).json(err);
};
