import { HttpException } from '@/http/nodegen/errors';
import NodegenRequest from '@/http/nodegen/interfaces/NodegenRequest';
import * as express from 'express';

export default (errorLogger?: (error: any) => void) => {
  let logErrors = (error: HttpException) => console.error(error.stack || error);

  if (typeof errorLogger === 'function') {
    logErrors = errorLogger;
  }

  return (err: HttpException, req: NodegenRequest, res: express.Response, next: express.NextFunction) => {
    logErrors(err);
    next(err);
  };
}
