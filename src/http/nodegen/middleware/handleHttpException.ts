import * as express from 'express';
import { NodegenRequest } from '../interfaces';
import { HttpException } from '../errors';

/**
 * Http Exception handler
 */
export default () => (err: any, req: NodegenRequest, res: express.Response, next: express.NextFunction) => {
  if (err instanceof HttpException) {
    if (err.status === 500) {
      console.error(err);
    }

    if (err.isJson()) {
      return res.status(err.status).json(err.body);
    } else {
      return res.status(err.status).send(err.body);
    }
  }

  next(err);
}
