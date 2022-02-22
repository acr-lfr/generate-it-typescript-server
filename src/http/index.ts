import express, { Express } from 'express';
import http from 'http';
import { AddressInfo } from 'net';
import { handleDomain404, handleExpress404, handleHttpException, requestMiddleware } from '@/http/nodegen/middleware';
import routesImporter, { RoutesImporter } from '@/http/nodegen/routesImporter';
import packageJson from '../../package.json';
import { HandleExceptionInjection } from '@/http/nodegen/middleware/handleHttpException';

export interface Http {
  expressApp: express.Application;
  start: () => Promise<http.Server>;
}

export interface HttpOptions {
  // a preconfigured express app, if present the api will use this express app opposed to generating a new one.
  app?: Express;

  // Custom injection into the src/http/nodegen/middleware/handleHttpException.ts
  handleExceptionInjection?: HandleExceptionInjection;

  // An array of valid express ApplicationRequestHandlers (middlewares) injected BEFORE loading routes
  preRouteApplicationRequestHandlers?: any | [string, any][];

  // an array of valid express ApplicationRequestHandlers (middlewares) injected AFTER loading routes
  postRouteApplicationRequestHandlers?: any | [string, any][];

  // Options injectable into the routes importer
  routesImporter?: RoutesImporter;
}

export default async (port: number, options?: HttpOptions): Promise<Http> => {
  const app = options?.app || express();

  const middlewareInjector = (middlewares: Array<(...args: any) => any> | Array<[string, any]>) => {
    middlewares.forEach((handler: any) => {
      if (Array.isArray(handler)) {
        app.use(handler[0], handler[1]);
      } else {
        app.use(handler);
      }
    });
  };

  // Generally middlewares that should parse the request before hitting a route
  requestMiddleware(app);
  if (options?.preRouteApplicationRequestHandlers) {
    middlewareInjector(options?.preRouteApplicationRequestHandlers);
  }

  // The actual API routes
  routesImporter(app, options?.routesImporter);

  // Built in 404 handlers
  app.use(handleExpress404());
  app.use(handleDomain404());

  // Custom response middlewares
  if (options?.postRouteApplicationRequestHandlers) {
    middlewareInjector(options?.postRouteApplicationRequestHandlers);
  }
  // Lastly the catchAll handler
  app.use(handleHttpException(options.handleExceptionInjection));

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
