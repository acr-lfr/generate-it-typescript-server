import { HttpErrorsService } from '@/services/HttpErrorsService';
import * as express from 'express';
import { HttpException } from '../errors';
import { NodegenRequest } from '../interfaces';

/**
 * Http Exception handler
 */
export default () => (err: any, req: NodegenRequest, res: express.Response, next: express.NextFunction) => {
  if (!(err instanceof HttpException)) {
    err = HttpErrorsService.fromError(err);
  }

  if (err.status === 500) {
    console.error(err);
  }

  if (err.isJson()) {
    return res.status(err.status).json(err.body);
  } else {
    return res.status(err.status).send(err.body);
  }
};
