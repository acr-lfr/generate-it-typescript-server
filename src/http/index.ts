import express, { Express } from 'express';
import http from 'http';
import { AddressInfo } from 'net';
import { handleDomain404, handleExpress404, handleHttpException, requestMiddleware } from '@/http/nodegen/middleware';
import routesImporter, { RoutesImporter } from '@/http/nodegen/routesImporter';
import packageJson from '../../package.json';
import { HandleExceptionOpts } from '@/http/nodegen/middleware/handleHttpException';

export interface Http {
  expressApp: express.Application;
  start: () => Promise<http.Server>;
}

type Middlewares = Array<(...args: any) => any> | Array<[string, any]>

export interface HttpOptions {
  // a preconfigured express app, if present the api will use this express app opposed to generating a new one.
  app?: Express;

  // Optionally inject options into the http exception handler
  httpExceptionOpts?: HandleExceptionOpts;

  // An array of valid express ApplicationRequestHandlers (middlewares) injected BEFORE loading routes
  preRouteMiddleware?: Middlewares;

  /**
   * @deprecated Please use preRouteMiddleware instead, this will be removed soon
   */
  preRouteApplicationRequestHandlers?: Middlewares;

  // an array of valid express ApplicationRequestHandlers (middlewares) injected AFTER loading routes
  postRouteMiddleware?: Middlewares;

  /**
   * @deprecated Please use preRouteMiddleware instead, this will be removed soon
   */
  postRouteApplicationRequestHandlers?: Middlewares;

  // Options injectable into the routes importer
  routesImporter?: RoutesImporter;
}

export default async (port: number, options: HttpOptions = {}): Promise<Http> => {
  const app = options?.app || express();

  const middlewareInjector = (middlewares: Middlewares) => {
    middlewares.forEach((handler: any) => {
      if (Array.isArray(handler)) {
        app.use(handler[0], handler[1]);
      } else {
        app.use(handler);
      }
    });
  };

  options.preRouteMiddleware = options?.preRouteMiddleware || options?.preRouteApplicationRequestHandlers
  options.postRouteMiddleware = options?.postRouteMiddleware || options?.postRouteApplicationRequestHandlers

  // Generally middlewares that should parse the request before hitting a route
  requestMiddleware(app);
  if (options?.preRouteMiddleware) {
    middlewareInjector(options?.preRouteMiddleware);
  }

  // The actual API routes
  routesImporter(app, options?.routesImporter);

  // Built in 404 handlers
  app.use(handleExpress404());
  app.use(handleDomain404());

  // Custom response middlewares
  if (options?.postRouteMiddleware) {
    middlewareInjector(options?.postRouteMiddleware);
  }

  // Lastly the catchAll handler
  app.use(handleHttpException(options.httpExceptionOpts));

  // Deprecation warnings
  if(options?.preRouteApplicationRequestHandlers){
    console.log('preRouteApplicationRequestHandlers will be deprecated soon, please use preRouteMiddleware instead')
  }
  if(options?.postRouteApplicationRequestHandlers){
    console.log('postRouteApplicationRequestHandlers will be deprecated soon, please use postRouteMiddleware instead')
  }

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
