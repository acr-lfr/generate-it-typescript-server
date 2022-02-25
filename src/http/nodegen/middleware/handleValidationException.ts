import { HttpException, UnprocessableEntityException } from '@/http/nodegen/errors';
import { isCelebrateError } from 'celebrate';
import { NextFunction, Response } from 'express';
import NodegenRequest from '../interfaces/NodegenRequest';

export default () => (error: HttpException, req: NodegenRequest, res: Response, next: NextFunction) => {
  if (isCelebrateError(error)) {
    return next(new UnprocessableEntityException(Object.fromEntries(error.details)));
  }

  return next(error);
};
