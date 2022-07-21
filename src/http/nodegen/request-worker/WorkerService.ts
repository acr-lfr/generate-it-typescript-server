import { IncomingMessage } from 'http';
import { pick } from 'lodash';
import { default as workerFarm, end } from 'worker-farm';
import config from '@/config';
import NodegenRequest from '@/http/interfaces/NodegenRequest';
import { HttpException } from '@/http/nodegen/errors';
import http401 from '@/http/nodegen/errors/401';
import http403 from '@/http/nodegen/errors/403';
import http404 from '@/http/nodegen/errors/404';
import http409 from '@/http/nodegen/errors/409';
import http410 from '@/http/nodegen/errors/410';
import http422 from '@/http/nodegen/errors/422';
import http423 from '@/http/nodegen/errors/423';
import http429 from '@/http/nodegen/errors/429';
import { WorkerData } from './types';

interface SerializedError {
  message?: string;
  stack?: string;
  name?: string;
}

const REQUEST_SERIALIZED_KEYS: string[] = [
  'jwtData',
  'xApiKey',
  'originalToken',
  'headers',
  'protocol',
  'hostname',
  'url',
  'originalUrl',
  'query',
  'params',
  'body',
];

const HTTP_ERROR_CONSTRUCTORS: Record<string, (message?: string) => HttpException> = {
  http401,
  http403,
  http404,
  http409,
  http410,
  http422,
  http423,
  http429,
  HttpException: HttpException.bind(HttpException, 500) as any, // @NOTE: TypeScript does not like the .bind() function
};

// Check the config default config to ensure you have the
// worker attibutes: https://github.com/acrontum/openapi-nodegen-typescript-server/blob/master/src/config.ts
// Ensure you also have in the package.json:
// "worker-farm": "^1.7.0",
const execWorker = workerFarm(
  {
    maxConcurrentWorkers: config.requestWorker.processes,
    maxConcurrentCallsPerWorker: config.requestWorker.threadsPerProcess,
    maxRetries: 1,
    autoStart: true,
  },
  `${process.cwd()}/build/src/http/nodegen/request-worker/process.js`
);

class WorkerService {
  /**
   * This will never be overridden.
   * If the swagger path contains x-request-proxy this services is used.
   * @param req
   * @param domainName
   * @param domainFunction
   * @param domainFunctionArgs
   */
  public handleRequestWithWorker(
    req: NodegenRequest,
    domainName: string,
    domainFunction: string,
    domainFunctionArgs: any[]
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      const workerData: WorkerData = {
        domainName,
        domainFunction,
        domainFunctionArgs: domainFunctionArgs.map((arg) => {
          if (arg instanceof IncomingMessage) {
            return pick(req, REQUEST_SERIALIZED_KEYS);
          }
          return arg;
        }),
      };

      execWorker(workerData, (error?: SerializedError, response?: any) => {
        if (!error) {
          return resolve(response);
        }

        if (!error.name) {
          return reject(new Error(error as string));
        }

        const ErrorConstructor = HTTP_ERROR_CONSTRUCTORS[error.name] || Error;

        try {
          throw ErrorConstructor(error.message);
        } catch (err: any) {
          err.stack = error.stack;
          return reject(err);
        }
      });
    });
  }

  public close(): Promise<void> {
    return new Promise((resolve, reject) =>
      end(execWorker, (err: Error, data: any) => (err ? reject(err) : resolve(data)))
    );
  }
}

export default new WorkerService();
