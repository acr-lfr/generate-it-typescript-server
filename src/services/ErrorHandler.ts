import { HttpException } from '@/http/nodegen/errors';
import NodegenRequest from '@/http/nodegen/interfaces/NodegenRequest';
import * as express from 'express';
import { createHttpExceptionFromErr } from '@/http/nodegen/utils/createHttpExceptionFromErr';
import config from '@/config';

class ErrorHandler {
  express (err: HttpException, req: NodegenRequest, res: express.Response, next: express.NextFunction) {
    if (!(err instanceof HttpException)) {
      err = createHttpExceptionFromErr(err);
    }

    console.error(err.stack || err);

    if (err.status === 500 && config.env === 'production') {
      return res.status(err.status).json({ message: 'Internal server error' });
    } else {
      return res.status(err.status).json(err);
    }
  }
}

export default new ErrorHandler();
