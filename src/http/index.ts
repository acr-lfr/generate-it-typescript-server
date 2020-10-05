import express from 'express';
import { requestMiddleware, responseMiddleware } from '@/http/nodegen/middleware';
import routesImporter from '@/http/nodegen/routesImporter';
import packageJson from '../../package.json';

export interface Http {
  expressApp: express.Application,
  start: () => void
}

export interface HttpOptions {
  // an array of valid express ApplicationRequestHandlers (middlewares) injected BEFORE loading routes
  preRouteApplicationRequestHandlers?: any[]
  // an array of valid express ApplicationRequestHandlers (middlewares) injected AFTER loading routes
  postRouteApplicationRequestHandlers?: any[]
}

export default async (port: number, options?: HttpOptions): Promise<Http> => {
  const app = express();
  requestMiddleware(app);
  if (options?.preRouteApplicationRequestHandlers) {
    options?.preRouteApplicationRequestHandlers.forEach((applicationRequestHandler) => {
      app.use(applicationRequestHandler);
    });
  }
  routesImporter(app);
  responseMiddleware(app);
  if (options?.postRouteApplicationRequestHandlers) {
    options?.postRouteApplicationRequestHandlers.forEach((applicationRequestHandler) => {
      app.use(applicationRequestHandler);
    });
  }
  return {
    expressApp: app,
    start: (): void => {
      app.listen(port, () => {
        console.log(`${packageJson.name}:${packageJson.version} server listening on port, ${port} with process ID (pid): ${process.pid}`);
      });
    }
  };
}
