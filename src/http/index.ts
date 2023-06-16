import express, { Express } from 'express';
import http from 'http';
import { AddressInfo } from 'net';
import {
  AppMiddlewareOptions,
  handleDomain404,
  handleExpress404,
  handleHttpException,
  requestMiddleware
} from '@/http/nodegen/middleware';
import routesImporter, { RoutesImporter } from '@/http/nodegen/routesImporter';
import packageJson from '../../package.json';

export interface Http {
  expressApp: express.Application;
  start: () => Promise<http.Server>;
}

export interface HttpOptions {
  // a preconfigured express app, if present the api will use this express app opposed to generating a new one.
  app?: Express;

  // Options injectable into the app middlewares loader
  appMiddlewareOptions?: AppMiddlewareOptions;

  // Options injectable into the routes importer
  routesImporter?: RoutesImporter;

  // An array of valid express ApplicationRequestHandlers (middlewares) injected BEFORE loading routes
  requestMiddleware?: any | [string, any][];

  // an array of valid express ApplicationRequestHandlers (middlewares) injected AFTER loading routes
  errorMiddleware?: any | [string, any][];

  // Options passed to handleHttpException middleware
  httpException?: {
    // optional error hook function called on application error
    errorHook?: (error: any) => void;

    // optional error logger which replaces console.error on application error
    errorLogger?: (error: any) => void;
  };

  /**
   *  @deprecated Use the requestMiddleware instead
   */
  preRouteApplicationRequestHandlers?: any | [string, any][];

  /**
   *  @deprecated Use the errorMiddleware instead
   */
  postRouteApplicationRequestHandlers?: any | [string, any][];
}

export default async (port: number, options: HttpOptions = {}): Promise<Http> => {
  const app = options.app || express();

  const useMiddlewares = (requestHandlers: Array<(...args: any) => any> | Array<[string, any]>) => {
    requestHandlers.forEach((handler: any) => {
      if (Array.isArray(handler)) {
        app.use(handler[0], handler[1]);
      } else {
        app.use(handler);
      }
    });
  };

  // Generally middlewares that should parse the request before hitting a route
  requestMiddleware(app, options?.appMiddlewareOptions);
  if (options.requestMiddleware) {
    useMiddlewares(options.requestMiddleware);
  }

  // The actual API routes
  routesImporter(app, options?.routesImporter);

  // Error/ response middlewares
  app.use(handleExpress404());
  app.use(handleDomain404());
  if (options.errorMiddleware) {
    useMiddlewares(options.errorMiddleware);
  }
  app.use(
    handleHttpException(options.httpException)
  );

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
