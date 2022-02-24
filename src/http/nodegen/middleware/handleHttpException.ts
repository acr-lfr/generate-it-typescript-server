import { createHttpExceptionFromErr } from '@/http/nodegen/utils/createHttpExceptionFromErr';
import * as express from 'express';
import { HttpException } from '../errors';
import NodegenRequest from '../interfaces/NodegenRequest';
import config from '@/config';
import packageJson from '../../../../package.json';

export type exceptionHook = (err: HttpException & { serviceName: string, time: string }) => void

export interface HandleExceptionOpts {
  hookForStatus?: {
    [statusCode: number]: exceptionHook
  };
}

/**
 * Http Exception handler
 */
export default (options: HandleExceptionOpts = {}) => {
  return (err: HttpException, req: NodegenRequest, res: express.Response) => {
    if (!(err instanceof HttpException)) {
      err = createHttpExceptionFromErr(err);
    }

    console.error(err.stack || err);

    if (options.hookForStatus && options.hookForStatus[err.status]) {
      try {
        options.hookForStatus[err.status]({
          ...err,
          serviceName: packageJson.name,
          time: new Date().toDateString()
        });
      } catch (e) {
        console.error(`Error in status ${err.status} hook:`, e);
      }
    }

    if (err.status === 500 && config.env === 'production') {
      return res.status(err.status).json({ message: 'Internal server error' });
    } else {
      return res.status(err.status).json(err);
    }
  };
}
