import express, { Express } from 'express';
import http from 'http';
import { AddressInfo } from 'net';
import { handleDomain404, handleExpress404, requestMiddleware } from '@/http/nodegen/middleware';
import routesImporter, { RoutesImporter } from '@/http/nodegen/routesImporter';
import packageJson from '../../package.json';
import formatErrorMiddeware from '@/http/nodegen/middleware/formatErrorMiddeware';
import exceptionLogMiddleware from '@/http/nodegen/middleware/exceptionLogMiddleware';
import exceptionCatchAll from '@/http/nodegen/middleware/exceptionCatchAll';

export interface Http {
  expressApp: express.Application;
  start: () => Promise<http.Server>;
}

export interface HttpOptions {
  // a preconfigured express app, if present the api will use this express app opposed to generating a new one.
  app?: Express;

  // Options injectable into the routes importer
  routesImporter?: RoutesImporter;

  // An array of valid express ApplicationRequestHandlers (middlewares) injected BEFORE loading routes
  preRouteMiddleware?: any | [string, any][];

  // an array of valid express ApplicationRequestHandlers (middlewares) injected AFTER loading routes
  postRouteMiddleware?: any | [string, any][];

  // optional logger which replaces console.error on application error
  errorLogger?: (error: any) => void;
}

export default async (port: number, options: HttpOptions = {}): Promise<Http> => {
  const app = options.app || express();

  const useRequestHandlers = (requestHandlers: Array<(...args: any) => any> | Array<[string, any]>) => {
    requestHandlers.forEach((handler: any) => {
      if (Array.isArray(handler)) {
        app.use(handler[0], handler[1]);
      } else {
        app.use(handler);
      }
    });
  };

  // Generally middlewares that should parse the request before hitting a route
  requestMiddleware(app);
  if (options.preRouteMiddleware) {
    useRequestHandlers(options.preRouteMiddleware);
  }

  // The actual API routes
  routesImporter(app, options.routesImporter);

  // Response middlwares
  app.use(handleExpress404());
  app.use(handleDomain404());
  app.use(formatErrorMiddeware);
  if (options.postRouteMiddleware) {
    useRequestHandlers(options.postRouteMiddleware);
  }
  app.use(exceptionLogMiddleware(options.errorLogger));
  app.use(exceptionCatchAll());

  return {
    expressApp: app,
    start: (): Promise<http.Server> => {
      return new Promise<http.Server>((resolve) => {
        const server = app.listen(port, () => {
          console.log(`${packageJson.name}:${packageJson.version} server listening on port, ${(server.address() as AddressInfo).port}`);
          return resolve(server);
        });
      });
    }
  };
}
